import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { contractPathAndHash } from "../lib/safe-id.mjs";

const broker = vi.hoisted(() => {
  const canonical = (value) => Array.isArray(value)
    ? `[${value.map(canonical).join(",")}]`
    : value && typeof value === "object"
      ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`
      : JSON.stringify(value);
  const output = (packet, verdict) => {
    const ids = ["C1", "C2", "C3", "H1", "H2", "H3"];
    const revised = verdict === "revise_required";
    return JSON.stringify({
      packet_hash: packet.packet_hash, manifest_hash: packet.manifest_hash, diff_sha256: packet.diff_sha256,
      contract_hash: packet.contract_hash, skill_bundle_hash: packet.skill_bundle_hash, packet_status: "complete", verdict,
      summary: "review completed against packet evidence", findings: revised ? [{ file: "a", line: 1, rule_id: "H1", severity: "blocking", issue: "publication must follow durable persistence", evidence: "changes.diff:a:1 shows publication before persistence", suggested_fix: "persist the state before publishing it" }] : [],
      checklist: ids.map((id) => ({ id, passed: !(revised && id === "H1"), evidence: `changes.diff:a:1 verifies ${id}` })),
      pass_items: ids.filter((id) => !(revised && id === "H1")).map((rule_id) => ({ rule_id, artifact_anchor: `changes.diff:a:1#${rule_id}`, evidence: `changes.diff:a:1 proves ${rule_id}` })),
      skillResults: [],
      ...(revised ? { rootCause: "publication happens before the durable write", fixApproach: "make persistence complete before publication" } : {}),
    });
  };
  return { calls: [], clientOptions: [], currentPacket: null, output, reset() { this.calls.length = 0; this.clientOptions.length = 0; this.currentPacket = null; } };
});

vi.mock("../broker-client.mjs", () => ({
  BrokerClient: class {
    constructor(options) { broker.clientOptions.push(options); }
    async discoverCapabilities() {
      return { version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [
        { provider: "opencode", status: "ready", capabilities: { continuation: true, attachment_delivery: ["file_only"] } },
      ] };
    }
    async status() { return { expires_at_ms: Date.now() + 60_000 }; }
    async run(input) {
      broker.calls.push(input);
      const packet = input.packet ?? {
        ...broker.currentPacket,
        packet_hash: input.request.prompt.match(/current_packet_hash=([a-f0-9]{64})/)?.[1],
        manifest_hash: input.request.prompt.match(/current_manifest_hash=([a-f0-9]{64})/)?.[1],
        diff_sha256: input.request.prompt.match(/current_diff_sha256=([a-f0-9]{64})/)?.[1],
      };
      return { runtime_id: "11111111-1111-4111-8111-111111111111", providers: [{ provider: "opencode", status: "completed", session_id: "provider-session", delivery_used: "file_only", output: broker.output(packet, input.request.continuation ? "pass" : "revise_required") }] };
    }
  },
}));

const cli = new URL("../wh-review-cli.mjs", import.meta.url);
const roots = [];
const originalHome = process.env.HOME;
afterEach(() => { broker.reset(); if (originalHome === undefined) delete process.env.HOME; else process.env.HOME = originalHome; roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })); });

const sha = (value) => createHash("sha256").update(value).digest("hex");
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function git(root, args, encoding = "utf8") { return execFileSync("git", args, { cwd: root, encoding }).trim(); }
function manifest(packet) {
  return sha(canonical({ diff_sha256: packet.diff_sha256, changed_files: packet.changed_files.map(({ path, old_path, status, sha256, size, old_sha256, old_size }) => ({ path, old_path: old_path ?? null, status, sha256: sha256 ?? null, size: size ?? null, old_sha256: old_sha256 ?? null, old_size: old_size ?? null })), raw_requirement: packet.raw_requirement, decision_log_excerpt: null, acceptance_design_excerpt: packet.acceptance_design_excerpt, planning_artifacts: [], verification_closure: [], test_evidence: packet.test_evidence, host_verified_facts: packet.host_verified_facts, contract_hash: packet.contract_hash, skill_bundle_hash: packet.skill_bundle_hash, source_revision: packet.source_revision }));
}
function reviewPacket() {
  return { version: "review-packet.v1", stage: "build-code", review_track: null, raw_requirement: "make state publication durable", acceptance_design_excerpt: "AC: publication happens after persistence", test_evidence: [{ name: "unit", status: "passed" }], host_verified_facts: [], contract_hash: contractPathAndHash("build-code").contractHash, skill_bundle_hash: sha(canonical([])) };
}
function repository() {
  const root = mkdtempSync(join(tmpdir(), "wh-review-cli-continuation-")); roots.push(root);
  git(root, ["init", "-q"]); git(root, ["config", "user.email", "review@example.test"]); git(root, ["config", "user.name", "Review Test"]);
  writeFileSync(join(root, "a"), "old\n"); git(root, ["add", "a"]); git(root, ["commit", "-qm", "base"]);
  const base = git(root, ["rev-parse", "HEAD"]);
  writeFileSync(join(root, "a"), "first change\n"); git(root, ["add", "a"]); git(root, ["commit", "-qm", "first"]);
  return { root, base };
}
function linkedWorktree(target, branch) {
  const worktree = mkdtempSync(join(tmpdir(), "wh-review-cli-linked-")); rmSync(worktree, { recursive: true, force: true });
  git(target, ["worktree", "add", "-q", "-b", branch, worktree]); roots.push(worktree);
  return worktree;
}
function hostConfig(root) {
  const home = join(root, "home"); const packetRoot = join(root, "packets"); const brokerConfig = join(root, "3rd-review.json");
  mkdirSync(join(home, ".workflowhub"), { recursive: true }); mkdirSync(packetRoot);
  writeFileSync(brokerConfig, JSON.stringify({ version: 4, attachment_roots: [{ root: packetRoot, sources: [".wh-review-packets"] }] }));
  writeFileSync(join(home, ".workflowhub", "config.json"), JSON.stringify({ task_dir: root, third_review: { command: "broker", config: brokerConfig, attachment_root: packetRoot } }));
  process.env.HOME = home;
  return realpathSync(packetRoot);
}
function expectPrivateRawDirectory(path, taskRoot) {
  expect(path).toEqual(expect.any(String));
  expect(path.startsWith(join(taskRoot, "reviews", "private", "round-"))).toBe(true);
  expect(path.endsWith(join("provider-raw"))).toBe(true);
  expect(path).not.toContain(join("reviews", "core-receipts"));
}

describe("wh-review CLI continuation", () => {
  it("rejects incomplete, inactive, and unrelated trusted worktree state", async () => {
    const { runReviewRound } = await import(cli.href);
    const { root: target } = repository(); const worktree = linkedWorktree(target, "workflowhub/trusted-state"); const { root: unrelated } = repository();
    const tracking = mkdtempSync(join(tmpdir(), "wh-review-cli-tracking-")); roots.push(tracking); const taskId = "trusted-state";
    mkdirSync(join(tracking, taskId), { recursive: true });
    const valid = { target_repo_root: target, worktree_root: worktree, branch: git(worktree, ["branch", "--show-current"]), created_by_stage: "make-decision", push_policy: "verify-code-only", status: "active" };
    for (const state of [{ ...valid, status: "closed" }, (() => { const { status, ...missing } = valid; return missing; })(), { ...valid, target_repo_root: unrelated }, { ...valid, branch: "workflowhub/too-many-parts-here" }, { ...valid, branch: "workflowhub/UPPER" }]) {
      writeFileSync(join(tracking, taskId, "worktree.json"), JSON.stringify(state));
      await expect(runReviewRound({ task_id: taskId, stage: "build-code", review_flow_id: "flow", packet: reviewPacket(), task_tracking_root: tracking })).rejects.toThrow(/trusted task worktree/);
    }
  });

  it("forwards closure evidence and cross-stage carryovers into a real second review round", async () => {
    const { runReviewRound } = await import(cli.href);
    const { root: target, base } = repository(); const worktree = linkedWorktree(target, "workflowhub/cli-continuation");
    const tracking = mkdtempSync(join(tmpdir(), "wh-review-cli-tracking-")); roots.push(tracking);
    const taskId = "cli-continuation";
    mkdirSync(join(tracking, taskId), { recursive: true });
    writeFileSync(join(tracking, taskId, "worktree.json"), JSON.stringify({ target_repo_root: target, worktree_root: worktree, branch: git(worktree, ["branch", "--show-current"]), created_by_stage: "make-decision", push_policy: "verify-code-only", status: "active" }));
    const packetRoot = hostConfig(tracking);
    const firstPacket = reviewPacket();
    await runReviewRound({ task_id: taskId, stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: firstPacket, task_tracking_root: tracking });
    const firstReceipt = JSON.parse(readFileSync(join(tracking, taskId, "reviews", "private", "round-build-code-flow-1", "round-receipt.json"), "utf8"));
    const findingId = firstReceipt.merged_findings[0].finding_id;

    writeFileSync(join(worktree, "a"), "first change\nfixed\n");
    const secondPacket = reviewPacket(); broker.currentPacket = secondPacket;
    const closure_evidence = [{ finding_id: findingId, evidence: "changes.diff:a:2 records the persistence fix" }];
    const upstream = { intent: { stage: "build-plan" }, semantic_verdict: "revise_required", needs_human: true, merged_findings: [{ finding_id: "verify-later" }], dispositions: [{ finding_id: "verify-later", action: "defer", evidence: "verification is scheduled after the build" }] };
    const upstreamBytes = Buffer.from(JSON.stringify(upstream)); const upstreamHash = sha(upstreamBytes); const upstreamPath = join(tracking, taskId, "reviews", "core-receipts", `${upstreamHash}.json`); mkdirSync(join(upstreamPath, ".."), { recursive: true }); writeFileSync(upstreamPath, upstreamBytes);
    const cross_stage_carryovers = [{ carryover_id: "verify-later", source_stage: "build-plan", source_core_receipt_hash: upstreamHash, status: "open", evidence: "verification is scheduled after the build" }];
    const result = await runReviewRound({ task_id: taskId, stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: secondPacket, task_tracking_root: tracking, continuation: true, closure_evidence, cross_stage_carryovers });

    expect(result.transport.continuation_eligible).toBe(true);
    expect(broker.clientOptions.map(({ attachmentRoot }) => attachmentRoot)).toEqual([packetRoot, packetRoot]);
    expect(broker.calls).toHaveLength(2);
    expect(broker.calls[1]).toMatchObject({ request: expect.objectContaining({ continuation: { runtime_id: "11111111-1111-4111-8111-111111111111" } }) });
    expect(Object.keys(broker.calls[1]).sort()).toEqual(["privateRawDirectory", "request"]);
    expectPrivateRawDirectory(broker.calls[1].privateRawDirectory, join(realpathSync(tracking), taskId));
    expect(broker.calls[1].request.prompt).toContain(JSON.stringify(closure_evidence, null, 2));
    expect(broker.calls[1].request.prompt).toContain(JSON.stringify(cross_stage_carryovers, null, 2));
  });
});
