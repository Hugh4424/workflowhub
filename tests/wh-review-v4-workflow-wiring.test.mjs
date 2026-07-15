import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
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
function deliveryForInput(input, packet) {
  const files = input.attachments.entries.map(({ destination: target, sha256, size, embed }) => ({ target, sha256, size, embed }));
  const material_manifest_hash = sha(canonical({ version: 1, bundle_id: input.attachments.bundle_id, files: files.filter((item) => !["review-packet.v1.json", "manifest.json"].includes(item.target)).map(({ target, sha256, size, embed }) => ({ target, sha256, size, embed })) }));
  const visible = input.attachments.entries.map(({ destination, sha256, size }) => ({ destination, sha256, size }));
  const delivery_manifest_hash = sha(canonical({ version: 1, bundle_id: input.attachments.bundle_id, delivery_mode: input.attachmentDelivery, files: files.filter((item) => item.target !== "manifest.json") }));
  const continuation = input.request.continuation ? { initial_material_manifest_hash: input.request.continuation.initial_material_manifest_hash, sequence: input.request.continuation.sequence, previous_delivery_manifest_hash: input.request.continuation.previous_delivery_manifest_hash } : null;
  return { delivery_mode: input.attachmentDelivery, raw_material_manifest_hash: material_manifest_hash, material_manifest_hash, material_representation: "raw", redaction: { rule_version: "host-root-prefix.v1", root_set_hash: sha("test-roots"), roots: [], replacement_count: 0, raw_material_manifest_hash: material_manifest_hash, derived_material_manifest_hash: material_manifest_hash, residual_scan: "passed" }, derived_attestation: { packet_hash: packet.packet_hash, manifest_hash: packet.manifest_hash, diff_sha256: packet.diff_sha256, delivery_manifest_hash, continuation }, material_total_bytes: input.attachments.entries.reduce((total, item) => total + item.size, 0), ...(input.attachmentDelivery === "always_embed" ? { rendered_prompt_bytes: 1 } : {}), provider_visible_attachment_manifest: visible };
}
function completedProvider(input, packet) {
  const output = reviewerOutput(packet); const stdout = join(input.privateRawDirectory, "opencode.stdout.raw"); const stderr = join(input.privateRawDirectory, "opencode.stderr.raw");
  mkdirSync(input.privateRawDirectory, { recursive: true });
  writeFileSync(stdout, output); writeFileSync(stderr, "");
  return { provider: "opencode", status: "completed", session_id: "provider-session", delivery_used: input.attachmentDelivery, delivery: deliveryForInput(input, packet), raw_stdout_ref: stdout, raw_stderr_ref: stderr, raw_stdout_sha256: sha(output), raw_stderr_sha256: sha(""), output };
}
function projectedContract(stage, reviewTrack) {
  const source = readFileSync(contractPathAndHash(stage).contractPath, "utf8");
  if (stage !== "make-decision") return source;
  const selected = `## review_track: ${reviewTrack}`;
  const start = source.indexOf(selected); const next = source.indexOf("## review_track:", start + selected.length);
  return `${source.slice(0, source.indexOf("## review_track:"))}${source.slice(start, next < 0 ? undefined : next)}`;
}
function materialPacket(stage, reviewTrack = null) {
  const result = {
    version: "review-packet.v1",
    stage,
    review_track: reviewTrack,
    raw_requirement: "review this change",
    acceptance_design_excerpt: "AC: marker is visible",
    decision_log_excerpt: "decision",
    planning_artifacts: [],
    verification_closure: [],
    test_evidence: [{ fact_id: "unit", kind: "command", source: "npm test", captured_at: "2026-07-15T00:00:00Z", sha256: sha("unit passed"), status: "passed", exit_code: 0 }],
    host_verified_facts: [],
    contract_hash: sha(projectedContract(stage, reviewTrack)),
    skill_bundle_hash: bundleHash(stage, reviewTrack),
  };
  if (stage === "make-decision" && reviewTrack === "direction") {
    delete result.decision_log_excerpt; delete result.acceptance_design_excerpt; delete result.planning_artifacts; delete result.verification_closure; delete result.test_evidence;
  }
  return result;
}
function initializeTargetRepository(repository) {
  git(repository, ["init", "-q"]); git(repository, ["config", "user.email", "review@example.test"]); git(repository, ["config", "user.name", "Review Test"]);
  writeFileSync(join(repository, "a.txt"), "before\n"); git(repository, ["add", "a.txt"]); git(repository, ["commit", "-qm", "base"]);
  return git(repository, ["rev-parse", "HEAD"]);
}
function linkedTaskWorktree(repository, branch) {
  const worktree = mkdtempSync(join(tmpdir(), "wh-review-wiring-worktree-"));
  rmSync(worktree, { recursive: true, force: true });
  git(repository, ["worktree", "add", "-q", "-b", branch, worktree]);
  return worktree;
}
function expectPrivateRawDirectory(path, taskRoot) {
  expect(path).toEqual(expect.any(String));
  expect(path.startsWith(join(taskRoot, "reviews", "private", "round-"))).toBe(true);
  expect(path.endsWith(join("provider-raw"))).toBe(true);
  expect(path).not.toContain(join("reviews", "core-receipts"));
}
function reviewerOutput(packet) {
  const skillResults = resolveRequiredSkills({ stage: packet.stage, reviewTrack: packet.review_track }).definitions.map(({ name, bundle }) => { const anchor = `skills/${name}/${bundle.files[0].path}#L10`; return { skill: name, mode: "lens-only", checked_objects: [anchor], evidence: `${anchor} was checked against the frozen packet evidence`, conclusion: "the selected lens found no contract violation in the packet" }; });
  const contract = projectedContract(packet.stage, packet.review_track);
  const ids = [...new Set(contract.match(/\b(?:(?:DIR|DET)-)?[CH]\d+\b/g) ?? ["contract"])];
  const checklist = ids.map((id) => ({ id, passed: true, evidence: `review-packet.v1.json#${id} has specific packet evidence` }));
  const pass_items = ids.map((id) => ({ rule_id: id, artifact_anchor: `review-packet.v1.json#${id}`, evidence: `${id} is supported by the frozen packet contents` }));
  return JSON.stringify({ packet_status: "complete", verdict: "pass", summary: "packet marker reviewed against concrete contract evidence", findings: [], checklist, pass_items, skillResults });
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
    expect(content).toContain("make-decision-flow");
  });

  it("uses one packet review flow for build-code instead of dual reviewer delegation", () => {
    const content = v4("build-code");
    expect(content).toContain("single code review flow");
    expect(content).not.toContain("spec-compliance");
    expect(content).not.toContain("code-quality");
  });

  it("binds build-code and verify-code review calls to the trusted task worktree", () => {
    for (const stage of ["build-code", "verify-code"]) {
      const content = skill(stage);
      expect(content).toContain("task_id:");
      expect(content).toContain("task_tracking_root: taskRecords.task_tracking_root");
      expect(content).toContain(`stage: "${stage}"`);
      expect(content).toContain("review_flow_id:");
      expect(content).toContain("packet");
      expect(content).toMatch(/host.*(?:capture|generat).*source diff/i);
    }
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
  ])("captures uncommitted trusted-worktree packets and continues its first runtime for %s/%s", async (stage, reviewTrack) => {
    const tracking = mkdtempSync(join(tmpdir(), "wh-review-wiring-tracking-"));
    const repository = mkdtempSync(join(tmpdir(), "wh-review-wiring-repo-"));
    const calls = []; let currentPacket; let frozenStageContract;
    let sourceRoot = null;
    try {
      const initialHead = initializeTargetRepository(repository);
      const branch = `workflowhub/wiring-${stage.replace("-", "")}-${reviewTrack ?? "main"}`;
      sourceRoot = linkedTaskWorktree(repository, branch);
      writeFileSync(join(sourceRoot, "a.txt"), "before\nWIRING_R1_UNCOMMITTED_MARKER\n");
      const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, sourceRoot, broker: {
        async discoverCapabilities() { return { version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [{ provider: "opencode", status: "ready", capabilities: { continuation: true, attachment_delivery: ["file_only"] } }] }; },
        async run(input) { calls.push(input); const contractEntry = input.attachments?.entries.find(({ destination }) => destination === `contracts/${stage}.md`); if (contractEntry) frozenStageContract = readFileSync(join(root, contractEntry.source), "utf8"); return { runtime_id: "11111111-1111-4111-8111-111111111111", providers: [completedProvider(input, currentPacket)] }; },
        async status() { return { expires_at_ms: Date.now() + 60_000 }; },
      } });
      const input = { task_id: `task-${stage}-${reviewTrack ?? "main"}`, stage, review_track: reviewTrack, review_flow_id: "first-runtime", packet: materialPacket(stage, reviewTrack) };
      const firstPrepared = await facade.prepare(input); currentPacket = firstPrepared.packet;
      const first = await facade.run(firstPrepared);
      if (stage === "make-decision") {
        expect(frozenStageContract).toContain(`## review_track: ${reviewTrack}`);
        expect(frozenStageContract).not.toContain(`## review_track: ${reviewTrack === "direction" ? "detail" : "direction"}`);
        expect(sha(frozenStageContract)).toBe(firstPrepared.packet.contract_hash);
      }
      expect(git(sourceRoot, ["rev-parse", "HEAD"])).toBe(initialHead);
      expect(firstPrepared.packet.unified_diff).toContain("WIRING_R1_UNCOMMITTED_MARKER");
      expect(firstPrepared.packet.source_revision.snapshot_tree).toMatch(/^[a-f0-9]{40,64}$/);
      expect(first.provider_outcomes).toMatchObject([{ transport_status: "completed", packet_status: "complete", business_valid: true, semantic_verdict: "pass" }]);
      expect(first).not.toHaveProperty("semantic_verdict");
      expect(readFileSync(first.receipt_draft_ref, "utf8")).toContain("provider-session");
      if (stage !== "make-decision") {
        const publication = facade.publish(first, { items: [] });
        expect(publication).toMatchObject({ semantic_verdict: "pass", core_receipt_hash: expect.stringMatching(/^[a-f0-9]{64}$/), needs_human: false });
        const core = JSON.parse(readFileSync(publication.core_receipt_ref, "utf8"));
        expect(Array.isArray(core.provider_outcomes[0].skillResults)).toBe(true);
        expect(core.provider_outcomes[0].skillResults).toHaveLength(first.provider_outcomes[0].skillResults?.length ?? 0);
        if (stage !== "build-plan") expect(core.provider_outcomes[0].skillResults).toEqual(expect.arrayContaining(first.provider_outcomes[0].skillResults ?? []));
        expect(JSON.stringify(core)).not.toMatch(/\/Users\/reviewer|Bearer|skill-secret-token|123e4567/i);
      }
      writeFileSync(join(sourceRoot, "a.txt"), "before\nWIRING_R1_UNCOMMITTED_MARKER\nWIRING_R2_DELTA_ONLY_MARKER\n");
      const secondPrepared = await facade.prepare({ ...input, packet: materialPacket(stage, reviewTrack), continuation: true }); currentPacket = secondPrepared.packet;
      const second = await facade.run(secondPrepared);
      expect(git(sourceRoot, ["rev-parse", "HEAD"])).toBe(initialHead);
      expect(secondPrepared.packet.source_revision.base_tree).toBe(firstPrepared.packet.source_revision.snapshot_tree);
      expect(secondPrepared.packet.unified_diff).toContain("WIRING_R2_DELTA_ONLY_MARKER");
      expect(second.intent.initial_runtime_id).toBe("11111111-1111-4111-8111-111111111111");
      expect(calls[1].request.continuation).toMatchObject({ runtime_id: "11111111-1111-4111-8111-111111111111", initial_material_manifest_hash: expect.stringMatching(/^[a-f0-9]{64}$/), sequence: 1, previous_delivery_manifest_hash: null });
      expect(Object.keys(calls[1]).sort()).toEqual(["attachmentDelivery", "attachments", "privateRawDirectory", "request"]);
      expectPrivateRawDirectory(calls[1].privateRawDirectory, join(tracking, input.task_id));
      expect(calls[1].request).not.toHaveProperty("packet");
      expect(calls[1].request.prompt).not.toContain("WIRING_R2_DELTA_ONLY_MARKER");
      expect(calls[1].attachments.entries.every((entry) => entry.embed === false)).toBe(true);
      expect(calls[1].attachments.entries.map((entry) => entry.destination)).toEqual(expect.arrayContaining(["review-packet.v1.json", "changes.diff", "continuation-delta.v1.json", "manifest.json"]));
    } finally { rmSync(tracking, { recursive: true, force: true }); if (sourceRoot) rmSync(sourceRoot, { recursive: true, force: true }); rmSync(repository, { recursive: true, force: true }); }
  });
});
