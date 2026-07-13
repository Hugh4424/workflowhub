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
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { contractPathAndHash } from "../skills/wh-review/scripts/lib/safe-id.mjs";
import { loadTrustedThirdReviewConfig } from "../skills/wh-review/scripts/third-review-host-config.mjs";
import { initialPrompt, continuationPrompt, buildContinuationDelta } from "../skills/wh-review/scripts/review-prompt.mjs";
import { canonicalPacketJson as canonical, reviewManifestHash, reviewPacketHash } from "../skills/wh-review/scripts/review-packet-integrity.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repository = resolve(here, "..");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const safeJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

function git(root, args, encoding = "utf8") { return execFileSync("git", args, { cwd: root, encoding }).trim(); }
function bytes(root, revision, path) { return execFileSync("git", ["show", `${revision}:${path}`], { cwd: root }); }
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
function reviewPacket(root, base, head, { roundKind = "initial", baselinePacketHash = null } = {}) {
  const unified_diff = execFileSync("git", ["diff", "--no-ext-diff", "--binary", "--find-renames", "--full-index", base, head], { cwd: root, encoding: "utf8" });
  const current = bytes(root, head, "smoke.txt"); const previous = bytes(root, base, "smoke.txt");
  const packet = {
    version: "review-packet.v1", stage: "build-code", review_track: null, round_kind: roundKind, baseline_packet_hash: baselinePacketHash,
    unified_diff, changed_files: [{ path: "smoke.txt", status: "modified", sha256: sha(current), size: current.length, old_sha256: sha(previous), old_size: previous.length }],
    raw_requirement: "Preserve the smoke marker while adding a deterministic, reviewable change.",
    acceptance_design_excerpt: roundKind === "initial"
      ? "AC: R1_DIFF_MARKER is present in round 1."
      : "AC: R2_DELTA_ONLY_MARKER is introduced in this continuation delta.",
    test_evidence: [{ name: "smoke-fixture", status: "passed", evidence: "git fixture commits were created locally" }], host_verified_facts: [{ fact: "The packet is generated from a disposable local git repository." }],
    contract_hash: contractPathAndHash("build-code").contractHash, skill_bundle_hash: sha(canonical([])), source_revision: { base, head },
  };
  packet.diff_sha256 = sha(unified_diff); packet.manifest_hash = reviewManifestHash(packet); packet.packet_hash = reviewPacketHash(packet);
  return packet;
}
function setupRepository(root) {
  git(root, ["init", "-q"]); git(root, ["config", "user.email", "wh-review-smoke@example.invalid"]); git(root, ["config", "user.name", "wh-review smoke"]);
  writeFileSync(join(root, "smoke.txt"), "base\n"); git(root, ["add", "smoke.txt"]); git(root, ["commit", "-qm", "base"]);
  const base = git(root, ["rev-parse", "HEAD"]);
  writeFileSync(join(root, "smoke.txt"), "base\nR1_DIFF_MARKER\n"); git(root, ["add", "smoke.txt"]); git(root, ["commit", "-qm", "round 1"]);
  const r1 = git(root, ["rev-parse", "HEAD"]);
  return { base, r1 };
}
function advanceRepository(root) {
  writeFileSync(join(root, "smoke.txt"), "base\nR1_DIFF_MARKER\nR2_DELTA_ONLY_MARKER\n"); git(root, ["add", "smoke.txt"]); git(root, ["commit", "-qm", "round 2 delta"]);
  return git(root, ["rev-parse", "HEAD"]);
}
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
function assertWhAggregate(receipt, expectedPacket, expectedMarker, expectedRuntimeId = null) {
  const result = receipt.value; const outcome = assertProviderRound({ providerId: "kimi", round: result.intent.business_round, response: { runtime_id: result.runtime_id, providers: result.provider_outcomes }, expectedMarker, expectedPacketHash: expectedPacket.packet_hash, expectedDiffSha256: expectedPacket.diff_sha256, expectedRuntimeId, requirePacketValidation: true });
  const eligible = result.provider_outcomes.filter((item) => item.transport_status === "completed" && item.packet_status === "complete" && item.business_valid === true);
  requireValue(eligible.length === 1 && eligible[0].provider === "kimi", `SMOKE_KIMI_R${result.intent.business_round}_FAIL: aggregate included an incomplete provider outcome`);
  requireValue(result.merged_findings.every((finding) => Array.isArray(finding.providers) && finding.providers.every((id) => id === "kimi")), `SMOKE_KIMI_R${result.intent.business_round}_FAIL: aggregate finding provenance is invalid`);
  return outcome;
}
function closureEvidence(receipt) { return (receipt.value.merged_findings ?? []).map((finding) => ({ finding_id: finding.finding_id, evidence: "changes.diff:smoke.txt:3 records the round-2 delta closure evidence" })); }
function attachmentsFor(packet, attachmentRoot, bundleId) {
  const staging = join(attachmentRoot, ".wh-review-packets", bundleId);
  const entries = [
    ["review-packet.v1.json", safeJson(packet)], ["changes.diff", packet.unified_diff],
    ["contracts/provider-protocol.md", readFileSync(join(repository, "skills/wh-review/contracts/provider-protocol.md"), "utf8")],
    ["contracts/build-code.md", readFileSync(join(repository, "skills/wh-review/contracts/build-code.md"), "utf8")],
    ["schemas/reviewer-output.schema.json", readFileSync(join(repository, "skills/wh-review/schemas/reviewer-output.schema.json"), "utf8")],
  ];
  const manifestEntries = entries.map(([destination, content]) => {
    const source = join(staging, destination); write(source, content);
    return { source: `.wh-review-packets/${bundleId}/${destination}`, destination, size: Buffer.byteLength(content), sha256: sha(content), embed: true };
  });
  return { staging, manifest: { version: 1, bundle_id: bundleId, entries: manifestEntries } };
}
export function directPrompt(packet, round) {
  const contract = readFileSync(join(repository, "skills/wh-review/contracts/build-code.md"), "utf8");
  const intent = { contract_hash: packet.contract_hash, skill_bundle_hash: packet.skill_bundle_hash };
  if (round === 1) return initialPrompt({ packet, intent, stageContract: contract, deliveryMode: "always_embed", requiredSkills: [] }) + "\nSmoke acceptance requirement: your reviewer-output JSON must re-attest packet_hash and diff_sha256 exactly, and quote R1_DIFF_MARKER exactly in evidence.";
  const delta = buildContinuationDelta({ previousPacket: packet.previous_packet, currentPacket: packet, deltaSource: { unified_diff: packet.delta_diff, changed_files: packet.delta_changed_files }, previousFindings: [], closureEvidence: [], crossStageCarryovers: [], requiredSkills: [] });
  return continuationPrompt(delta, { stage: "build-code" }) + "\nSmoke acceptance requirement: your reviewer-output JSON must re-attest packet_hash and diff_sha256 exactly, quote R2_DELTA_ONLY_MARKER exactly in evidence, and must not reopen prior-round findings.";
}
async function runThirdReview({ thirdReview, requestPath, responsePath, attachments = null, delivery = null }) {
  const [command, ...prefix] = commandParts(thirdReview.command);
  const args = [...prefix, "run", `--config=${thirdReview.config}`, `--request=${requestPath}`];
  if (attachments) args.push(`--attachments=${attachments}`, `--attachments-root=${thirdReview.attachmentRoot}`, `--attachment-delivery=${delivery}`);
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
  const skipKimi = process.env.WH_REVIEW_SMOKE_SKIP_KIMI === "1";
  mkdirSync(outputRoot, { recursive: true, mode: 0o700 });
  const evidence = { status: "RUNNING", output_root: outputRoot, entrypoints: { wh_review: join(repository, "skills/wh-review/scripts/wh-review-cli.mjs"), third_review: thirdReview.command }, markers: { round1: "R1_DIFF_MARKER", round2: "R2_DELTA_ONLY_MARKER" } };
  const evidencePath = join(outputRoot, "evidence.json"); write(evidencePath, evidence);
  let attachmentStaging = null;
  try {
    const source = join(outputRoot, "source-repository"); mkdirSync(source, { mode: 0o700 }); const { base, r1 } = setupRepository(source);
    const r1Packet = reviewPacket(source, base, r1);
    const r2 = advanceRepository(source); const r2Packet = reviewPacket(source, base, r2, { roundKind: "continuation", baselinePacketHash: r1Packet.packet_hash });
    const taskRoot = join(outputRoot, "wh-review-state"); const taskId = "provider-smoke";
    let kimiEvidence = null;
    if (!skipKimi) {
      const kimiFirstInput = { task_id: taskId, stage: "build-code", review_flow_id: "smoke-flow", host_provider: "codex", packet: r1Packet, task_tracking_root: taskRoot, repository_root: source };
      const kimiFirstInputPath = join(outputRoot, "kimi-r1-input.json"); write(kimiFirstInputPath, kimiFirstInput);
      await runWhReview({ inputPath: kimiFirstInputPath, responsePath: join(outputRoot, "kimi-r1-cli.json") });
      const kimiR1 = privateReceipt(taskRoot, taskId, 1); const kimiOutcome1 = assertWhAggregate(kimiR1, r1Packet, "R1_DIFF_MARKER");
      requireValue(kimiOutcome1.raw_output_ref && existsSync(kimiOutcome1.raw_output_ref), "SMOKE_KIMI_R1_FAIL: raw output evidence is missing");
      const kimiSecondInput = { task_id: taskId, stage: "build-code", review_flow_id: "smoke-flow", host_provider: "codex", packet: r2Packet, task_tracking_root: taskRoot, repository_root: source, continuation: true, closure_evidence: closureEvidence(kimiR1) };
      const kimiSecondInputPath = join(outputRoot, "kimi-r2-input.json"); write(kimiSecondInputPath, kimiSecondInput);
      await runWhReview({ inputPath: kimiSecondInputPath, responsePath: join(outputRoot, "kimi-r2-cli.json") });
      const kimiR2 = privateReceipt(taskRoot, taskId, 2); const kimiOutcome2 = assertWhAggregate(kimiR2, r2Packet, "R2_DELTA_ONLY_MARKER", kimiR1.value.runtime_id);
      requireValue(kimiOutcome2.session_id === kimiOutcome1.session_id, "SMOKE_KIMI_R2_FAIL: provider session_id changed instead of continuing");
      kimiEvidence = { runtime_id: kimiR1.value.runtime_id, session_id: kimiOutcome1.session_id, raw_stdout_sha256: [kimiOutcome1.raw_stdout_sha256, kimiOutcome2.raw_stdout_sha256], receipts: [kimiR1.path, kimiR2.path] };
    }

    const opencodeR1Prompt = directPrompt(r1Packet, 1); const opencodeBundle = attachmentsFor(r1Packet, thirdReview.attachmentRoot, `smoke-${randomUUID()}`); attachmentStaging = opencodeBundle.staging;
    const opencodeR1Request = { version: 4, host_provider: "codex", prompt: opencodeR1Prompt, continuation: null, provider_allowlist: ["opencode"] };
    const opencodeR1RequestPath = join(outputRoot, "opencode-r1-request.json"); const opencodeR1ManifestPath = join(outputRoot, "opencode-r1-attachments.json"); write(opencodeR1RequestPath, opencodeR1Request); write(opencodeR1ManifestPath, opencodeBundle.manifest);
    const opencodeR1 = await runThirdReview({ thirdReview, requestPath: opencodeR1RequestPath, responsePath: join(outputRoot, "opencode-r1-response.json"), attachments: opencodeR1ManifestPath, delivery: "always_embed" });
    const opencodeOutcome1 = assertProviderRound({ providerId: "opencode", round: 1, response: opencodeR1, expectedMarker: "R1_DIFF_MARKER", expectedPacketHash: r1Packet.packet_hash, expectedDiffSha256: r1Packet.diff_sha256 });
    requireValue(opencodeOutcome1.delivery_used === "always_embed", "SMOKE_OPENCODE_R1_FAIL: expected always_embed delivery");

    const deltaDiff = execFileSync("git", ["diff", "--no-ext-diff", "--binary", "--find-renames", "--full-index", "-U0", r1, r2], { cwd: source, encoding: "utf8" });
    r2Packet.previous_packet = r1Packet; r2Packet.delta_diff = deltaDiff; r2Packet.delta_changed_files = [{ path: "smoke.txt", status: "modified", sha256: sha(bytes(source, r2, "smoke.txt")), size: bytes(source, r2, "smoke.txt").length, old_sha256: sha(bytes(source, r1, "smoke.txt")), old_size: bytes(source, r1, "smoke.txt").length }];
    const opencodeR2Prompt = directPrompt(r2Packet, 2); requireValue(opencodeR2Prompt.includes("R2_DELTA_ONLY_MARKER") && !opencodeR2Prompt.includes("R1_DIFF_MARKER"), "SMOKE_OPENCODE_R2_FAIL: continuation prompt is not delta-only");
    const opencodeR2Request = { version: 4, host_provider: "codex", prompt: opencodeR2Prompt, continuation: { runtime_id: opencodeR1.runtime_id }, provider_allowlist: ["opencode"] };
    const opencodeR2RequestPath = join(outputRoot, "opencode-r2-request.json"); write(opencodeR2RequestPath, opencodeR2Request);
    const opencodeR2 = await runThirdReview({ thirdReview, requestPath: opencodeR2RequestPath, responsePath: join(outputRoot, "opencode-r2-response.json") });
    const opencodeOutcome2 = assertProviderRound({ providerId: "opencode", round: 2, response: opencodeR2, expectedMarker: "R2_DELTA_ONLY_MARKER", expectedPacketHash: r2Packet.packet_hash, expectedDiffSha256: r2Packet.diff_sha256, expectedRuntimeId: opencodeR1.runtime_id });
    requireValue(opencodeOutcome2.session_id === opencodeOutcome1.session_id, "SMOKE_OPENCODE_R2_FAIL: provider session_id changed instead of continuing");

    evidence.status = "PASS"; evidence.runtimes = { ...(kimiEvidence ? { kimi: kimiEvidence } : {}), opencode: { runtime_id: opencodeR1.runtime_id, session_id: opencodeOutcome1.session_id, raw_stdout_sha256: [opencodeOutcome1.raw_stdout_sha256, opencodeOutcome2.raw_stdout_sha256], requests: [opencodeR1RequestPath, opencodeR2RequestPath] } };
    write(evidencePath, evidence); process.stdout.write(`${JSON.stringify({ status: "PASS", evidence: evidencePath })}\n`);
  } catch (error) {
    evidence.status = "FAIL"; evidence.error = String(error?.message ?? error); write(evidencePath, evidence);
    process.stderr.write(`${JSON.stringify({ status: "FAIL", evidence: evidencePath, error: evidence.error })}\n`); process.exitCode = 1;
  } finally {
    if (attachmentStaging) rmSync(attachmentStaging, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
