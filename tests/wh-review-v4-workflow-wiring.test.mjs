import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ReviewRoundFacade } from "../skills/wh-review/scripts/review-round-facade.mjs";
import { contractPathAndHash } from "../skills/wh-review/scripts/lib/safe-id.mjs";
import { resolveRequiredSkills } from "../skills/wh-review/scripts/required-skill-resolver.mjs";

const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const legacy = ["prepareRoundState", "invoke-review-engine", "run-heterologous-review", "same-source", "--diff", "--output", "MAKE_DECISION_SKIP_BLIND_REVIEW", "reviewer_runtime_id", "reviewer_source", "verified_interface", "make-decision-review.md", "not_executed"];

function skill(stage) { return readFileSync(join(root, "workflows", stage, "SKILL.md"), "utf8"); }
function productionFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : productionFiles(path);
    return /\.(?:mjs|md|json)$/.test(entry.name) && !entry.name.endsWith(".test.mjs") ? [path] : [];
  });
}
const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}` : JSON.stringify(value);
function git(cwd, args, encoding = "utf8") { return execFileSync("git", args, { cwd, encoding }).trim(); }
function bundleHash(stage, reviewTrack) { return sha(canonical(resolveRequiredSkills({ stage, reviewTrack }).definitions.map(({ name, bundle }) => ({ name, sha256: bundle.sha256 })))); }
function refreshManifest(result) {
  result.diff_sha256 = sha(result.unified_diff);
  result.manifest_hash = sha(canonical({ diff_sha256: result.diff_sha256, changed_files: result.changed_files.map(({ path, old_path, status, sha256: fileHash, size, old_sha256, old_size }) => ({ path, old_path: old_path ?? null, status, sha256: fileHash ?? null, size: size ?? null, old_sha256: old_sha256 ?? null, old_size: old_size ?? null })), raw_requirement: result.raw_requirement, decision_log_excerpt: result.decision_log_excerpt ?? null, acceptance_design_excerpt: result.acceptance_design_excerpt ?? null, planning_artifacts: result.planning_artifacts ?? [], verification_closure: result.verification_closure ?? [], test_evidence: result.test_evidence ?? [], host_verified_facts: result.host_verified_facts, contract_hash: result.contract_hash, skill_bundle_hash: result.skill_bundle_hash, source_revision: result.source_revision }));
  return result;
}
function packet(repository, stage, reviewTrack = null) {
  git(repository, ["init", "-q"]); git(repository, ["config", "user.email", "review@example.test"]); git(repository, ["config", "user.name", "Review Test"]);
  writeFileSync(join(repository, "a.txt"), "before\n"); git(repository, ["add", "a.txt"]); git(repository, ["commit", "-qm", "base"]); const base = git(repository, ["rev-parse", "HEAD"]);
  writeFileSync(join(repository, "a.txt"), "WH_REVIEW_PACKET_MARKER\nafter\n"); git(repository, ["add", "a.txt"]); git(repository, ["commit", "-qm", "head"]); const head = git(repository, ["rev-parse", "HEAD"]);
  const unified_diff = execFileSync("git", ["diff", "--no-ext-diff", "--binary", "--find-renames", "--full-index", base, head], { cwd: repository, encoding: "utf8" });
  const oldBytes = Buffer.from("before\n"), bytes = Buffer.from("WH_REVIEW_PACKET_MARKER\nafter\n");
  const changed_files = [{ path: "a.txt", status: "modified", sha256: sha(bytes), size: bytes.length, old_sha256: sha(oldBytes), old_size: oldBytes.length }];
  const result = { version: "review-packet.v1", stage, review_track: reviewTrack, packet_hash: "0".repeat(64), unified_diff, diff_sha256: sha(unified_diff), changed_files, raw_requirement: "review this change", acceptance_design_excerpt: "AC: marker is visible", decision_log_excerpt: "decision", planning_artifacts: [], verification_closure: [], test_evidence: [{ name: "unit", status: "passed" }], host_verified_facts: [], contract_hash: contractPathAndHash(stage).contractHash, skill_bundle_hash: bundleHash(stage, reviewTrack), source_revision: { base, head } };
  if (stage === "make-decision" && reviewTrack === "direction") {
    delete result.decision_log_excerpt; delete result.acceptance_design_excerpt; delete result.planning_artifacts; delete result.verification_closure; delete result.test_evidence;
  }
  return refreshManifest(result);
}
function deltaPacket(repository, previous) {
  writeFileSync(join(repository, "a.txt"), "WH_REVIEW_PACKET_MARKER\nafter\nreal delta\n"); git(repository, ["add", "a.txt"]); git(repository, ["commit", "-qm", "continuation delta"]);
  const base = previous.source_revision.base, head = git(repository, ["rev-parse", "HEAD"]);
  const unified_diff = execFileSync("git", ["diff", "--no-ext-diff", "--binary", "--find-renames", "--full-index", base, head], { cwd: repository, encoding: "utf8" });
  const oldBytes = Buffer.from("before\n"), bytes = Buffer.from("WH_REVIEW_PACKET_MARKER\nafter\nreal delta\n");
  const next = { ...previous, packet_hash: "0".repeat(64), unified_diff, changed_files: [{ path: "a.txt", status: "modified", sha256: sha(bytes), size: bytes.length, old_sha256: sha(oldBytes), old_size: oldBytes.length }], source_revision: { base, head } };
  if (next.test_evidence) next.test_evidence = [...next.test_evidence, { name: "delta", status: "passed" }];
  return refreshManifest(next);
}
function reviewerOutput(packet) {
  const skillResults = resolveRequiredSkills({ stage: packet.stage, reviewTrack: packet.review_track }).definitions.map(({ name, bundle }) => ({ skill: name, bundle_hash: bundle.sha256, mode: "lens-only", checked_objects: ["review-packet.v1#packet_hash"], evidence: "review-packet.v1#packet_hash binds the inspected packet", conclusion: "the lens found no contract violation in the packet" }));
  let contract = readFileSync(contractPathAndHash(packet.stage).contractPath, "utf8");
  if (packet.stage === "make-decision") {
    const start = contract.indexOf(`## review_track: ${packet.review_track}`); const next = contract.indexOf("## review_track:", start + 1);
    contract = contract.slice(start, next < 0 ? undefined : next);
  }
  const ids = [...new Set(contract.match(/\b(?:C|F|H)\d+\b/g) ?? ["contract"])];
  const checklist = ids.map((id) => ({ id, passed: true, evidence: `review-packet.v1#${id} has specific packet evidence` }));
  const pass_items = ids.map((id) => ({ rule_id: id, artifact_anchor: `review-packet.v1#${id}`, evidence: `${id} is supported by the frozen packet contents` }));
  return JSON.stringify({ packet_hash: packet.packet_hash, manifest_hash: packet.manifest_hash, diff_sha256: packet.diff_sha256, contract_hash: packet.contract_hash, skill_bundle_hash: packet.skill_bundle_hash, packet_status: "complete", verdict: "pass", summary: "packet marker reviewed against concrete contract evidence", findings: [], checklist, pass_items, skillResults });
}
function v4(stage) {
  const content = skill(stage);
  const marker = "## V4 Review Round";
  const index = content.indexOf(marker);
  expect(index, `${stage} must define its V4 review boundary`).toBeGreaterThanOrEqual(0);
  const boundary = content.indexOf("## End V4 Review Round", index);
  expect(boundary, `${stage} must close its V4 review boundary`).toBeGreaterThan(index);
  return content.slice(index, boundary);
}

describe("wh-review v4 workflow wiring", () => {
  it.each(stages)("routes %s through ReviewRoundFacade only", (stage) => {
    const content = v4(stage);
    expect(content).toContain("ReviewRoundFacade");
    expect(content).toContain("runReviewRound");
    expect(content).toContain(`stage: \"${stage}\"`);
    for (const token of legacy) expect(content.toLowerCase()).not.toContain(token.toLowerCase());
  });

  it("keeps make-decision direction and detail as isolated flows", () => {
    const content = v4("make-decision");
    expect(content).toContain('review_track: "direction"');
    expect(content).toContain('review_track: "detail"');
    expect(content).toContain("direction-flow");
    expect(content).toContain("detail-flow");
  });

  it("uses one packet review flow for build-code instead of dual reviewer delegation", () => {
    const content = v4("build-code");
    expect(content).toContain("single code review flow");
    expect(content).not.toContain("spec-compliance");
    expect(content).not.toContain("code-quality");
  });

  it("documents packet-only provider isolation and private receipt evidence", () => {
    for (const stage of stages) {
      const content = v4(stage);
    expect(content).toContain("review-packet.v1");
    expect(content).toMatch(/Do\s+not\s+run git/);
    expect(content).toContain("reviews/private/round-");
    expect(content).toContain("cancel_source");
    expect(content).toContain("semantic_verdict");
    expect(content).toContain("core_receipt_hash");
    expect(content).toContain("needs_human");
    }
  });

  it("maps verify-code facade results through core receipts only", () => {
    const content = skill("verify-code");
    expect(content).toContain("core_receipt_hash");
    expect(content).toContain("semantic_verdict");
    expect(content).toContain("needs_human: true");
    expect(content).toContain("const published = await runReviewRound");
    expect(content).toContain("published.semantic_verdict");
    for (const token of ["facts-schema", "buildReviewFact", "verify-code.md", "artifactPath"]) expect(content).not.toContain(token);
  });

  it("contains no legacy review production path", () => {
    const files = [...productionFiles(join(root, "workflows")), ...productionFiles(join(root, "skills", "wh-review"))];
    for (const file of files) {
      const content = readFileSync(file, "utf8").toLowerCase();
      for (const token of legacy) expect(content, `${file} contains legacy review token ${token}`).not.toContain(token.toLowerCase());
    }
  });

  it.each([
    ["make-decision", "direction"], ["make-decision", "detail"], ["build-spec", null], ["build-plan", null], ["build-code", null], ["verify-code", null],
  ])("runs %s/%s with a complete private packet and continues its first runtime", async (stage, reviewTrack) => {
    const tracking = mkdtempSync(join(tmpdir(), "wh-review-wiring-tracking-"));
    const repository = mkdtempSync(join(tmpdir(), "wh-review-wiring-repo-"));
    const calls = []; let currentPacket;
    try {
      const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: {
        async discoverCapabilities() { return { version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [{ provider: "opencode", status: "ready", capabilities: { continuation: true, attachment_delivery: ["file_only"] } }] }; },
        async run(input) { calls.push(input); return { runtime_id: "11111111-1111-4111-8111-111111111111", providers: [{ provider: "opencode", status: "completed", session_id: "provider-session", delivery_used: "file_only", output: reviewerOutput(input.packet ?? currentPacket) }] }; },
        async status() { return { expires_at_ms: Date.now() + 60_000 }; },
      } });
      const firstPacket = packet(repository, stage, reviewTrack); currentPacket = firstPacket;
      const input = { task_id: `task-${stage}-${reviewTrack ?? "main"}`, stage, review_track: reviewTrack, review_flow_id: "first-runtime", packet: firstPacket, repository_root: repository };
      const first = await facade.run(facade.prepare(input));
      expect(first.provider_outcomes).toMatchObject([{ transport_status: "completed", packet_status: "complete", business_valid: true, semantic_verdict: "pass" }]);
      expect(first).not.toHaveProperty("semantic_verdict");
      expect(readFileSync(first.receipt_draft_ref, "utf8")).toContain("provider-session");
      const publication = facade.publish(first, { items: [] });
      expect(publication).toMatchObject({ semantic_verdict: "pass", core_receipt_hash: expect.stringMatching(/^[a-f0-9]{64}$/), needs_human: false });
      const core = JSON.parse(readFileSync(publication.core_receipt_ref, "utf8"));
      expect(Array.isArray(core.provider_outcomes[0].skillResults)).toBe(true);
      expect(core.provider_outcomes[0].skillResults).toEqual(expect.arrayContaining(first.provider_outcomes[0].skillResults ?? []));
      currentPacket = deltaPacket(repository, firstPacket);
      const second = await facade.run(facade.prepare({ ...input, packet: currentPacket, continuation: true }));
      expect(second.intent.initial_runtime_id).toBe("11111111-1111-4111-8111-111111111111");
      expect(calls[1].request.continuation).toEqual({ runtime_id: "11111111-1111-4111-8111-111111111111" });
      expect(Object.keys(calls[1])).toEqual(["request"]);
      expect(calls[1].request.prompt).toContain("real delta");
    } finally { rmSync(tracking, { recursive: true, force: true }); rmSync(repository, { recursive: true, force: true }); }
  });
});
