#!/usr/bin/env node

/**
 * Explicit, live acceptance probe for the V4 provider boundary.
 *
 * This is intentionally not part of `npm test`: it creates a disposable git
 * repository and calls subscribed providers.  It uses only the V4 public
 * entrypoints (`wh-review-cli.mjs run` and `3rd-review.mjs run`).
 */
import { createHash, randomUUID } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { contractPathAndHash } from "../skills/wh-review/scripts/lib/safe-id.mjs";
import { loadTrustedThirdReviewConfig } from "../skills/wh-review/scripts/third-review-host-config.mjs";
import { initialPrompt, continuationPrompt, buildContinuationDelta } from "../skills/wh-review/scripts/review-prompt.mjs";
import { canonicalPacketJson as canonical, reviewManifestHash, reviewPacketHash } from "../skills/wh-review/scripts/review-packet-integrity.mjs";
import { buildTreeMaterial, captureWorktreeTree, capturedHead, headTree } from "../skills/wh-review/scripts/source-tree.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repository = resolve(here, "..");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const safeJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const stripHunkSectionHeaders = (unifiedDiff) => unifiedDiff.replace(/^(@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@).*$/gm, "$1");

function git(root, args, encoding = "utf8") { return execFileSync("git", args, { cwd: root, encoding }).trim(); }
function run(command, args, { cwd, input } = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd, stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; }); child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => resolveRun({ code, stdout, stderr }));
    if (input !== undefined) child.stdin.end(input);
  });
}
function commandParts(command) { return Array.isArray(command) ? command : [command]; }
function write(path, value) { mkdirSync(dirname(path), { recursive: true, mode: 0o700 }); writeFileSync(path, typeof value === "string" ? value : safeJson(value), { mode: 0o600 }); }
function reviewPacket(root, baseTree, snapshotTree, { roundKind = "initial", baselinePacketHash = null } = {}) {
  const source = buildTreeMaterial(root, { baseTree, snapshotTree });
  const packet = {
    version: "review-packet.v1", stage: "build-code", review_track: null, round_kind: roundKind, baseline_packet_hash: baselinePacketHash,
    ...source, source_revision: { ...source.source_revision, captured_head: capturedHead(root) },
    raw_requirement: "Preserve the smoke marker while adding a deterministic, reviewable change.",
    acceptance_design_excerpt: roundKind === "initial"
      ? "AC: R1_DIFF_MARKER is present in round 1."
      : "AC: R2_DELTA_ONLY_MARKER is introduced in this continuation delta.",
    test_evidence: [{ name: "smoke-fixture", status: "passed", evidence: "temporary-index capture preserved the fixture HEAD" }], host_verified_facts: [{ fact: "The host generated packet material from a disposable local worktree tree." }],
    contract_hash: contractPathAndHash("build-code").contractHash, skill_bundle_hash: sha(canonical([])),
  };
  packet.diff_sha256 = sha(packet.unified_diff); packet.manifest_hash = reviewManifestHash(packet); packet.packet_hash = reviewPacketHash(packet);
  return packet;
}
function setupRepository(root) {
  git(root, ["init", "-q"]); git(root, ["config", "user.email", "wh-review-smoke@example.invalid"]); git(root, ["config", "user.name", "wh-review smoke"]);
  writeFileSync(join(root, "smoke.txt"), "base\n"); git(root, ["add", "smoke.txt"]); git(root, ["commit", "-qm", "base"]);
  return { baseTree: headTree(root), head: git(root, ["rev-parse", "HEAD"]) };
}
function writeRoundOne(root) { writeFileSync(join(root, "smoke.txt"), "base\nR1_DIFF_MARKER\n"); }
function writeRoundTwo(root) { writeFileSync(join(root, "smoke.txt"), "base\nR1_DIFF_MARKER\nR2_DELTA_ONLY_MARKER\n"); }
function outputText(outcome) {
  if (typeof outcome?.output === "string") return outcome.output;
  if (typeof outcome?.raw_output_ref === "string" && existsSync(outcome.raw_output_ref)) return readFileSync(outcome.raw_output_ref, "utf8");
  return "";
}
function requireValue(condition, message) { if (!condition) throw new Error(message); }
function provider(outcomes, id) { return outcomes.find((item) => item?.provider === id); }

export function assertProviderRound({ providerId, round, response, expectedMarker, expectedPacketHash, expectedDiffSha256, expectedRuntimeId = null, requirePacketValidation = false } = {}) {
  const outcome = provider(response?.providers ?? [], providerId);
  requireValue(outcome, `SMOKE_${providerId.toUpperCase()}_R${round}_MISSING_OUTCOME`);
  const status = outcome.status ?? outcome.transport_status;
  requireValue(status === "completed", `SMOKE_${providerId.toUpperCase()}_R${round}_FAIL: provider status=${status ?? "missing"}; ${outcome?.error?.code ?? outcome?.diagnostic ?? "no diagnostic"}`);
  requireValue(typeof outcome.session_id === "string" && outcome.session_id.length > 0, `SMOKE_${providerId.toUpperCase()}_R${round}_FAIL: session_id is missing`);
  requireValue(typeof outcome.raw_stdout_sha256 === "string" && /^[a-f0-9]{64}$/i.test(outcome.raw_stdout_sha256), `SMOKE_${providerId.toUpperCase()}_R${round}_FAIL: raw_stdout_sha256 is missing`);
  const raw = outputText(outcome);
  requireValue(raw.includes(expectedMarker), `SMOKE_${providerId.toUpperCase()}_R${round}_FAIL: provider output did not attest ${expectedMarker}`);
  requireValue(typeof expectedPacketHash === "string" && /^[a-f0-9]{64}$/.test(expectedPacketHash), `SMOKE_${providerId.toUpperCase()}_R${round}_FAIL: test packet_hash is invalid`);
  requireValue(typeof expectedDiffSha256 === "string" && /^[a-f0-9]{64}$/.test(expectedDiffSha256), `SMOKE_${providerId.toUpperCase()}_R${round}_FAIL: test diff_sha256 is invalid`);
  requireValue(raw.includes(expectedPacketHash), `SMOKE_${providerId.toUpperCase()}_R${round}_FAIL: provider raw output did not attest packet_hash`);
  requireValue(raw.includes(expectedDiffSha256), `SMOKE_${providerId.toUpperCase()}_R${round}_FAIL: provider raw output did not attest diff_sha256`);
  if (expectedRuntimeId !== null) requireValue(response.runtime_id === expectedRuntimeId, `SMOKE_${providerId.toUpperCase()}_R${round}_FAIL: runtime_id changed instead of continuing`);
  if (requirePacketValidation) {
    requireValue(outcome.packet_status === "complete" && outcome.business_valid === true, `SMOKE_${providerId.toUpperCase()}_R${round}_FAIL: packet/business validation failed (${outcome.packet_status ?? "missing"}/${outcome.business_valid})`);
  }
  return outcome;
}
function privateReceipt(taskRoot, taskId, round) {
  const path = join(taskRoot, taskId, "reviews", "private", `round-build-code-smoke-flow-${round}`, "round-receipt.json");
  requireValue(existsSync(path), `SMOKE_KIMI_R${round}_FAIL: wh-review private receipt is missing`);
  return { path, value: JSON.parse(readFileSync(path, "utf8")) };
}
function privatePacket(taskRoot, taskId, round) {
  const path = join(taskRoot, taskId, "reviews", "private", `round-build-code-smoke-flow-${round}`, "review-packet.json");
  requireValue(existsSync(path), `SMOKE_KIMI_R${round}_FAIL: wh-review frozen packet is missing`);
  return JSON.parse(readFileSync(path, "utf8"));
}
function cliPacket(packet) {
  const { round_kind, baseline_packet_hash, source_revision, unified_diff, changed_files, diff_sha256, manifest_hash, packet_hash, ...metadata } = packet;
  return metadata;
}
function assertWhAggregate(receipt, expectedPacket, expectedMarker, expectedRuntimeId = null) {
  const result = receipt.value; const outcome = assertProviderRound({ providerId: "kimi", round: result.intent.business_round, response: { runtime_id: result.runtime_id, providers: result.provider_outcomes }, expectedMarker, expectedPacketHash: expectedPacket.packet_hash, expectedDiffSha256: expectedPacket.diff_sha256, expectedRuntimeId, requirePacketValidation: true });
  const eligible = result.provider_outcomes.filter((item) => item.transport_status === "completed" && item.packet_status === "complete" && item.business_valid === true);
  requireValue(eligible.length === 1 && eligible[0].provider === "kimi", `SMOKE_KIMI_R${result.intent.business_round}_FAIL: aggregate included an incomplete provider outcome`);
  requireValue(result.merged_findings.every((finding) => Array.isArray(finding.providers) && finding.providers.every((id) => id === "kimi")), `SMOKE_KIMI_R${result.intent.business_round}_FAIL: aggregate finding provenance is invalid`);
  return outcome;
}
function closureEvidence(receipt) { return (receipt.value.merged_findings ?? []).map((finding) => ({ finding_id: finding.finding_id, evidence: "changes.diff:smoke.txt:3 records the round-2 delta closure evidence" })); }
export function finalizePassEvidence(evidence, { kimiEvidence, opencodeEvidence }) {
  evidence.status = "PASS";
  evidence.runtimes = { kimi: kimiEvidence, opencode: opencodeEvidence };
  return evidence;
}
export function writePassEvidence(path, evidence, providerEvidence) {
  write(path, finalizePassEvidence(evidence, providerEvidence));
  return JSON.parse(readFileSync(path, "utf8"));
}
function canonicalInnerManifestHash(manifest) { const { inner_manifest_hash: ignored, ...value } = manifest; return sha(canonical(value)); }
function canonicalDeliveryManifestHash(bundleId, files, deliveryMode) { return sha(canonical({ version: 1, bundle_id: bundleId, delivery_mode: deliveryMode, files: files.filter((item) => item.target !== "manifest.json").map(({ target, sha256, size, embed }) => ({ target, sha256, size, embed })) })); }
function canonicalMaterialManifestHash(bundleId, files) { return sha(canonical({ version: 1, bundle_id: bundleId, files: files.filter((item) => !["review-packet.v1.json", "manifest.json"].includes(item.target)).map(({ target, sha256, size, embed }) => ({ target, sha256, size, embed })) })); }
function attachmentRecord(destination, content, staging) {
  const source = join(staging, destination); write(source, content);
  return { source: `.wh-review-packets/${staging.split("/").at(-1)}/${destination}`, destination, size: Buffer.byteLength(content), sha256: sha(content), embed: false };
}
function attachmentsFor(packet, attachmentRoot, bundleId, { continuation = null, continuationDelta = null } = {}) {
  const staging = join(attachmentRoot, ".wh-review-packets", bundleId);
  const entries = [
    ["changes.diff", packet.unified_diff],
    ["contracts/provider-protocol.md", readFileSync(join(repository, "skills/wh-review/contracts/provider-protocol.md"), "utf8")],
    ["contracts/build-code.md", readFileSync(join(repository, "skills/wh-review/contracts/build-code.md"), "utf8")],
    ["schemas/reviewer-output.schema.json", readFileSync(join(repository, "skills/wh-review/schemas/reviewer-output.schema.json"), "utf8")],
  ];
  if (continuationDelta) entries.push(["continuation-delta.v1.json", safeJson(continuationDelta)]);
  const materialEntries = entries.map(([destination, content]) => attachmentRecord(destination, content, staging));
  const materialManifestHash = canonicalMaterialManifestHash(bundleId, materialEntries);
  const { previous_packet: ignoredPreviousPacket, delta_diff: ignoredDeltaDiff, delta_changed_files: ignoredDeltaChangedFiles, ...providerPacket } = packet;
  const boundPacket = { ...providerPacket, source_manifest_hash: providerPacket.manifest_hash, manifest_hash: materialManifestHash };
  boundPacket.packet_hash = reviewPacketHash(boundPacket);
  const packetEntry = attachmentRecord("review-packet.v1.json", safeJson(boundPacket), staging);
  const delivered = [packetEntry, ...materialEntries];
  const visible = {
    version: "review-attachment-manifest.v1", delivery_mode: "file_only", packet_hash: boundPacket.packet_hash,
    manifest_hash: boundPacket.manifest_hash, diff_sha256: boundPacket.diff_sha256,
    attachments: delivered.map(({ destination, sha256, size }) => ({ destination, sha256, size })),
    delivery_manifest_hash: canonicalDeliveryManifestHash(bundleId, delivered, "file_only"),
    ...(continuation ? { continuation } : {}),
  };
  visible.inner_manifest_hash = canonicalInnerManifestHash(visible);
  const innerEntry = attachmentRecord("manifest.json", safeJson(visible), staging);
  const manifestEntries = [...delivered, innerEntry];
  return { staging, packet: boundPacket, materialManifestHash, providerVisibleManifestHash: sha(safeJson(visible)), attachmentIds: manifestEntries.map(({ destination }) => destination), deliveryManifestHash: visible.delivery_manifest_hash, continuation: visible.continuation ?? null, manifest: { version: 1, bundle_id: bundleId, entries: manifestEntries } };
}
export function createPersistentAttachmentBundle(thirdReview, packet, bundleId, options = {}) {
  if (typeof thirdReview?.attachmentRoot !== "string" || !thirdReview.attachmentRoot) throw new TypeError("trusted third-review attachmentRoot is required");
  return { ...attachmentsFor(packet, thirdReview.attachmentRoot, bundleId, options), attachmentRoot: thirdReview.attachmentRoot };
}
export function directPrompt(packet, round, { attachmentIds, providerVisibleManifestHash } = {}) {
  const contract = readFileSync(join(repository, "skills/wh-review/contracts/build-code.md"), "utf8");
  const intent = { contract_hash: packet.contract_hash, skill_bundle_hash: packet.skill_bundle_hash };
  if (round === 1) return initialPrompt({ packet, intent, attachmentIds, providerVisibleManifestHash }) + "\nSmoke acceptance requirement: your reviewer-output JSON must re-attest packet_hash and diff_sha256 exactly, and quote the exact R1 diff marker discovered in changes.diff.";
  const delta = buildContinuationDelta({ previousPacket: packet.previous_packet, currentPacket: packet, deltaSource: { unified_diff: packet.delta_diff, changed_files: packet.delta_changed_files }, previousFindings: [], closureEvidence: [], crossStageCarryovers: [], requiredSkills: [] });
  return continuationPrompt(delta, { packet, intent, attachmentIds, providerVisibleManifestHash }) + "\nSmoke acceptance requirement: your reviewer-output JSON must re-attest packet_hash and diff_sha256 exactly, quote the exact R2 delta marker discovered in changes.diff, and must not reopen prior-round findings.";
}
export function buildThirdReviewRunArgs(thirdReview, { requestPath, attachments = null, delivery = null } = {}) {
  const [command, ...prefix] = commandParts(thirdReview.command);
  const args = [...prefix, "run", `--config=${thirdReview.config}`, `--request=${requestPath}`];
  if (attachments) args.push(`--attachments=${attachments}`, `--attachments-root=${thirdReview.attachmentRoot}`, `--attachment-delivery=${delivery}`);
  return { command, args };
}
async function runThirdReview({ thirdReview, requestPath, responsePath, attachments = null, delivery = null }) {
  const { command, args } = buildThirdReviewRunArgs(thirdReview, { requestPath, attachments, delivery });
  const result = await run(command, args); write(responsePath, { command, args, code: result.code, stdout: result.stdout, stderr: result.stderr });
  if (result.code !== 0) throw new Error(`SMOKE_OPENCODE_FAIL: 3rd-review exited ${result.code}; evidence=${responsePath}`);
  try { return JSON.parse(result.stdout); } catch { throw new Error(`SMOKE_OPENCODE_FAIL: 3rd-review returned non-JSON; evidence=${responsePath}`); }
}
async function runWhReview({ inputPath, responsePath }) {
  const result = await run(process.execPath, [join(repository, "skills/wh-review/scripts/wh-review-cli.mjs"), "run", inputPath]);
  write(responsePath, { code: result.code, stdout: result.stdout, stderr: result.stderr });
  if (result.code !== 0) throw new Error(`SMOKE_KIMI_FAIL: wh-review exited ${result.code}; evidence=${responsePath}`);
  try { return JSON.parse(result.stdout); } catch { throw new Error(`SMOKE_KIMI_FAIL: wh-review returned non-JSON; evidence=${responsePath}`); }
}
function nativeAuthReady(config) {
  for (const id of ["opencode", "kimi"]) {
    const source = config.providers?.[id];
    if (!source?.enabled) return { ready: false, reason: `${id} is disabled in the configured 3rd-review config` };
    if (source.auth?.type === "env" && source.auth.env.some((name) => !process.env[name])) return { ready: false, reason: `${id} is missing required auth env (${source.auth.env.join(",")})` };
    if (source.auth?.type === "native" && process.env.WH_REVIEW_SMOKE_ASSUME_NATIVE_AUTH !== "1") return { ready: false, reason: `${id} native auth is not asserted; set WH_REVIEW_SMOKE_ASSUME_NATIVE_AUTH=1 after logging in` };
  }
  return { ready: true };
}
function loadBrokerConfig(path) { return JSON.parse(readFileSync(path, "utf8")); }

async function main() {
  if (process.env.WH_REVIEW_PROVIDER_SMOKE !== "1") {
    process.stdout.write(`${JSON.stringify({ status: "SKIP", reason: "WH_REVIEW_PROVIDER_SMOKE=1 is required" })}\n`);
    return;
  }
  const thirdReview = loadTrustedThirdReviewConfig();
  const auth = nativeAuthReady(loadBrokerConfig(thirdReview.config));
  if (!auth.ready) {
    process.stdout.write(`${JSON.stringify({ status: "SKIP", reason: auth.reason })}\n`);
    return;
  }
  const outputRoot = process.env.WH_REVIEW_SMOKE_OUTPUT_ROOT ? resolve(process.env.WH_REVIEW_SMOKE_OUTPUT_ROOT) : mkdtempSync(join(tmpdir(), "wh-review-provider-smoke-"));
  mkdirSync(outputRoot, { recursive: true, mode: 0o700 });
  const evidence = { status: "RUNNING", output_root: outputRoot, entrypoints: { wh_review: join(repository, "skills/wh-review/scripts/wh-review-cli.mjs"), third_review: thirdReview.command }, markers: { round1: "R1_DIFF_MARKER", round2: "R2_DELTA_ONLY_MARKER" } };
  const evidencePath = join(outputRoot, "evidence.json"); write(evidencePath, evidence);
  try {
    const source = join(outputRoot, "source-repository"); mkdirSync(source, { mode: 0o700 }); const { baseTree, head: sourceHead } = setupRepository(source);
    writeRoundOne(source); const r1Tree = captureWorktreeTree(source, { baseTree }); const r1Packet = reviewPacket(source, baseTree, r1Tree);
    writeRoundTwo(source); const r2Tree = captureWorktreeTree(source, { baseTree: r1Tree }); const r2Packet = reviewPacket(source, r1Tree, r2Tree, { roundKind: "continuation", baselinePacketHash: r1Packet.packet_hash });
    requireValue(git(source, ["rev-parse", "HEAD"]) === sourceHead, "SMOKE_SOURCE_FAIL: R1/R2 capture created a commit");
    const taskRoot = join(outputRoot, "wh-review-state"); const taskId = "provider-smoke";
    const kimiTarget = join(outputRoot, "kimi-target-repository"); mkdirSync(kimiTarget, { mode: 0o700 }); const { head: kimiHead } = setupRepository(kimiTarget);
    const kimiSource = join(outputRoot, "kimi-worktree"); git(kimiTarget, ["worktree", "add", "-q", "-b", "workflowhub/provider-smoke", kimiSource]);
    writeRoundOne(kimiSource);
    write(join(taskRoot, taskId, "worktree.json"), { target_repo_root: kimiTarget, worktree_root: kimiSource, branch: git(kimiSource, ["branch", "--show-current"]), created_by_stage: "make-decision", push_policy: "verify-code-only", status: "active" });
    const kimiFirstInput = { task_id: taskId, stage: "build-code", review_flow_id: "smoke-flow", host_provider: "codex", packet: cliPacket(r1Packet), task_tracking_root: taskRoot };
    const kimiFirstInputPath = join(outputRoot, "kimi-r1-input.json"); write(kimiFirstInputPath, kimiFirstInput);
    const kimiR1ResponsePath = join(outputRoot, "kimi-r1-cli.json"); await runWhReview({ inputPath: kimiFirstInputPath, responsePath: kimiR1ResponsePath });
    const kimiR1 = privateReceipt(taskRoot, taskId, 1); const kimiR1Packet = privatePacket(taskRoot, taskId, 1); const kimiOutcome1 = assertWhAggregate(kimiR1, kimiR1Packet, "R1_DIFF_MARKER");
    requireValue(kimiOutcome1.raw_output_ref && existsSync(kimiOutcome1.raw_output_ref), "SMOKE_KIMI_R1_FAIL: raw output evidence is missing");
    writeRoundTwo(kimiSource);
    const kimiSecondInput = { task_id: taskId, stage: "build-code", review_flow_id: "smoke-flow", host_provider: "codex", packet: cliPacket(r2Packet), task_tracking_root: taskRoot, continuation: true, closure_evidence: closureEvidence(kimiR1) };
    const kimiSecondInputPath = join(outputRoot, "kimi-r2-input.json"); write(kimiSecondInputPath, kimiSecondInput);
    const kimiR2ResponsePath = join(outputRoot, "kimi-r2-cli.json"); await runWhReview({ inputPath: kimiSecondInputPath, responsePath: kimiR2ResponsePath });
    const kimiR2 = privateReceipt(taskRoot, taskId, 2); const kimiR2Packet = privatePacket(taskRoot, taskId, 2); const kimiOutcome2 = assertWhAggregate(kimiR2, kimiR2Packet, "R2_DELTA_ONLY_MARKER", kimiR1.value.runtime_id);
    requireValue(kimiR2Packet.source_revision.base_tree === kimiR1Packet.source_revision.snapshot_tree, "SMOKE_KIMI_R2_FAIL: packet base_tree does not continue from the R1 snapshot_tree");
    requireValue(kimiOutcome2.session_id === kimiOutcome1.session_id, "SMOKE_KIMI_R2_FAIL: provider session_id changed instead of continuing");
    requireValue(git(kimiSource, ["rev-parse", "HEAD"]) === kimiHead, "SMOKE_KIMI_FAIL: R1/R2 review created a commit");
    const kimiEvidence = { runtime_id: kimiR1.value.runtime_id, session_id: kimiOutcome1.session_id, raw_stdout_sha256: [kimiOutcome1.raw_stdout_sha256, kimiOutcome2.raw_stdout_sha256], receipts: [kimiR1.path, kimiR2.path], requests: [kimiFirstInputPath, kimiSecondInputPath], executions: [kimiR1ResponsePath, kimiR2ResponsePath] };

    const opencodeBundle = createPersistentAttachmentBundle(thirdReview, r1Packet, `smoke-${randomUUID()}`);
    const opencodeR1Prompt = directPrompt(opencodeBundle.packet, 1, opencodeBundle);
    const opencodeR1Request = { version: 4, host_provider: "codex", prompt: opencodeR1Prompt, continuation: null, provider_allowlist: ["opencode"], material_manifest_sha256: opencodeBundle.materialManifestHash, attachment_ids: opencodeBundle.manifest.entries.map(({ destination, sha256 }) => ({ destination, sha256 })) };
    const opencodeR1RequestPath = join(outputRoot, "opencode-r1-request.json"); const opencodeR1ManifestPath = join(outputRoot, "opencode-r1-attachments.json"); write(opencodeR1RequestPath, opencodeR1Request); write(opencodeR1ManifestPath, opencodeBundle.manifest);
    const opencodeR1ResponsePath = join(outputRoot, "opencode-r1-response.json"); const opencodeR1 = await runThirdReview({ thirdReview, requestPath: opencodeR1RequestPath, responsePath: opencodeR1ResponsePath, attachments: opencodeR1ManifestPath, delivery: "file_only" });
    const opencodeOutcome1 = assertProviderRound({ providerId: "opencode", round: 1, response: opencodeR1, expectedMarker: "R1_DIFF_MARKER", expectedPacketHash: opencodeBundle.packet.packet_hash, expectedDiffSha256: opencodeBundle.packet.diff_sha256 });
    requireValue(opencodeOutcome1.delivery_used === "file_only", "SMOKE_OPENCODE_R1_FAIL: expected file_only delivery");

    const deltaDiff = stripHunkSectionHeaders(execFileSync("git", ["diff", "--no-ext-diff", "--binary", "--find-renames", "--full-index", "-U0", r1Tree, r2Tree], { cwd: source, encoding: "utf8" }));
    r2Packet.baseline_packet_hash = opencodeBundle.packet.packet_hash; r2Packet.manifest_hash = reviewManifestHash(r2Packet); r2Packet.packet_hash = reviewPacketHash(r2Packet);
    r2Packet.previous_packet = opencodeBundle.packet; r2Packet.delta_diff = deltaDiff; r2Packet.delta_changed_files = r2Packet.changed_files;
    const continuationDelta = buildContinuationDelta({ previousPacket: opencodeBundle.packet, currentPacket: r2Packet, deltaSource: { unified_diff: deltaDiff, changed_files: r2Packet.changed_files }, previousFindings: [], closureEvidence: [], crossStageCarryovers: [], requiredSkills: [] });
    const opencodeR2Bundle = createPersistentAttachmentBundle(thirdReview, r2Packet, `smoke-${randomUUID()}`, { continuation: { initial_material_manifest_hash: opencodeBundle.materialManifestHash, sequence: 1, previous_delivery_manifest_hash: opencodeBundle.deliveryManifestHash }, continuationDelta });
    const opencodeR2Prompt = directPrompt({ ...opencodeR2Bundle.packet, previous_packet: opencodeBundle.packet, delta_diff: deltaDiff, delta_changed_files: r2Packet.changed_files }, 2, opencodeR2Bundle); write(join(outputRoot, "opencode-r2-prompt.txt"), opencodeR2Prompt); requireValue(!opencodeR2Prompt.includes("R2_DELTA_ONLY_MARKER") && !opencodeR2Prompt.includes("R1_DIFF_MARKER"), "SMOKE_OPENCODE_R2_FAIL: continuation material leaked into prompt");
    const opencodeR2Request = { version: 4, host_provider: "codex", prompt: opencodeR2Prompt, continuation: { runtime_id: opencodeR1.runtime_id, ...opencodeR2Bundle.continuation }, provider_allowlist: ["opencode"], material_manifest_sha256: opencodeR2Bundle.materialManifestHash, attachment_ids: opencodeR2Bundle.manifest.entries.map(({ destination, sha256 }) => ({ destination, sha256 })) };
    const opencodeR2RequestPath = join(outputRoot, "opencode-r2-request.json"); write(opencodeR2RequestPath, opencodeR2Request);
    const opencodeR2ManifestPath = join(outputRoot, "opencode-r2-attachments.json"); write(opencodeR2ManifestPath, opencodeR2Bundle.manifest);
    const opencodeR2ResponsePath = join(outputRoot, "opencode-r2-response.json"); const opencodeR2 = await runThirdReview({ thirdReview, requestPath: opencodeR2RequestPath, responsePath: opencodeR2ResponsePath, attachments: opencodeR2ManifestPath, delivery: "file_only" });
    requireValue(git(source, ["rev-parse", "HEAD"]) === sourceHead, "SMOKE_OPENCODE_FAIL: R1/R2 review created a commit");
    const opencodeOutcome2 = assertProviderRound({ providerId: "opencode", round: 2, response: opencodeR2, expectedMarker: "R2_DELTA_ONLY_MARKER", expectedPacketHash: opencodeR2Bundle.packet.packet_hash, expectedDiffSha256: opencodeR2Bundle.packet.diff_sha256, expectedRuntimeId: opencodeR1.runtime_id });
    requireValue(opencodeOutcome2.session_id === opencodeOutcome1.session_id, "SMOKE_OPENCODE_R2_FAIL: provider session_id changed instead of continuing");

    writePassEvidence(evidencePath, evidence, { kimiEvidence, opencodeEvidence: { runtime_id: opencodeR1.runtime_id, session_id: opencodeOutcome1.session_id, raw_stdout_sha256: [opencodeOutcome1.raw_stdout_sha256, opencodeOutcome2.raw_stdout_sha256], requests: [opencodeR1RequestPath, opencodeR2RequestPath], executions: [opencodeR1ResponsePath, opencodeR2ResponsePath], attachments: { root: opencodeBundle.attachmentRoot, bundle: opencodeBundle.staging, manifests: [opencodeR1ManifestPath, opencodeR2ManifestPath] } } });
    process.stdout.write(`${JSON.stringify({ status: "PASS", evidence: evidencePath })}\n`);
  } catch (error) {
    evidence.status = "FAIL"; evidence.error = String(error?.message ?? error); write(evidencePath, evidence);
    process.stderr.write(`${JSON.stringify({ status: "FAIL", evidence: evidencePath, error: evidence.error })}\n`); process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
