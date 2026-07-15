#!/usr/bin/env node

/** Opt-in live proof that the current audit scope reaches Kimi and OpenCode as file-only material. */
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { projectStageContract } from "../skills/wh-review/scripts/lib/safe-id.mjs";
import { resolveRequiredSkills } from "../skills/wh-review/scripts/required-skill-resolver.mjs";
import { buildTreeMaterial, captureWorktreeTree } from "../skills/wh-review/scripts/source-tree.mjs";
import { loadTrustedThirdReviewConfig } from "../skills/wh-review/scripts/third-review-host-config.mjs";
import { createSmokeHostEnvironment } from "./run-wh-review-provider-smoke.mjs";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const writeJson = (path, value) => { mkdirSync(dirname(path), { recursive: true, mode: 0o700 }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 }); };
const git = (root, args, options = {}) => String(execFileSync("git", args, { cwd: root, encoding: "utf8", ...options })).trim();
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };

export function auditE2eOptions(env = process.env) {
  if (env.WH_REVIEW_AUDIT_E2E !== "1") return { skip: true, reason: "WH_REVIEW_AUDIT_E2E=1 is required" };
  for (const name of ["WH_REVIEW_AUDIT_SOURCE", "WH_REVIEW_AUDIT_TASK"]) if (!env[name]) throw new Error(`${name} is required`);
  return { skip: false, source: resolve(env.WH_REVIEW_AUDIT_SOURCE), task: resolve(env.WH_REVIEW_AUDIT_TASK), output: env.WH_REVIEW_AUDIT_OUTPUT ? resolve(env.WH_REVIEW_AUDIT_OUTPUT) : mkdtempSync(join(tmpdir(), "wh-review-audit-e2e-")) };
}

function copyUntracked(source, mirror) {
  const names = git(source, ["ls-files", "--others", "--exclude-standard", "-z"], { encoding: "buffer" }).split("\0").filter(Boolean);
  for (const name of names) { const destination = join(mirror, name); mkdirSync(dirname(destination), { recursive: true }); copyFileSync(join(source, name), destination); }
  return names;
}

function rawText(outcome) {
  requireValue(typeof outcome.raw_stdout_ref === "string" && existsSync(outcome.raw_stdout_ref), `AUDIT_E2E_${outcome.provider}_RAW_MISSING`);
  const bytes = readFileSync(outcome.raw_stdout_ref);
  requireValue(hash(bytes) === outcome.raw_stdout_sha256, `AUDIT_E2E_${outcome.provider}_RAW_HASH_MISMATCH`);
  return bytes.toString("utf8");
}
function markersSpanDiff(unifiedDiff, markers) {
  const positions = markers.map((marker) => unifiedDiff.indexOf(marker)); const total = unifiedDiff.length;
  return positions[0] >= 0 && positions[0] < total * 0.1 && positions[1] > total * 0.25 && positions[1] < total * 0.75 && positions[2] > total * 0.9;
}

export function assertAuditEvidence({ receipt, packet, auditScopeFiles, markers }) {
  requireValue(packet.changed_files.length === auditScopeFiles + markers.length, "AUDIT_E2E_SCOPE_MISMATCH: delivered scope is not audit scope plus marker files");
  requireValue(markersSpanDiff(packet.unified_diff, markers), "AUDIT_E2E_MARKER_POSITION_INVALID: markers do not cover the beginning, middle, and end of changes.diff");
  const evidence = {};
  for (const provider of ["kimi", "opencode"]) {
    const outcome = receipt.provider_outcomes.find((item) => item.provider === provider);
    requireValue(outcome?.transport_status === "completed" && outcome.packet_status === "complete" && outcome.business_valid === true, `AUDIT_E2E_${provider}_INVALID: ${outcome?.diagnostic ?? "missing outcome"}`);
    requireValue(outcome.delivery_used === "file_only", `AUDIT_E2E_${provider}_NOT_FILE_ONLY`);
    requireValue(outcome.delivery?.derived_attestation?.packet_hash === packet.packet_hash && outcome.delivery?.derived_attestation?.diff_sha256 === packet.diff_sha256, `AUDIT_E2E_${provider}_PACKET_HASH_MISMATCH`);
    const visible = new Map((outcome.delivery?.provider_visible_attachment_manifest ?? []).map((item) => [item.destination, item]));
    for (const name of ["test-strategy.md", "requirements-ledger.json", "requirements-coverage.json"]) {
      const item = visible.get(`evidence/${name}`);
      requireValue(/^[a-f0-9]{64}$/.test(item?.sha256 ?? "") && Number.isSafeInteger(item?.size) && item.size > 0, `AUDIT_E2E_${provider}_EVIDENCE_MANIFEST_INVALID: ${name}`);
    }
    const raw = rawText(outcome); for (const marker of markers) requireValue(raw.includes(marker), `AUDIT_E2E_${provider}_MARKER_MISSING: ${marker}`);
    evidence[provider] = { session_id: outcome.session_id, raw_stdout_ref: outcome.raw_stdout_ref, raw_stdout_sha256: outcome.raw_stdout_sha256, delivery_manifest_hash: outcome.delivery.derived_attestation.delivery_manifest_hash };
  }
  return evidence;
}

async function main() {
  const options = auditE2eOptions();
  if (options.skip) { process.stdout.write(`${JSON.stringify({ status: "SKIP", reason: options.reason })}\n`); return; }
  mkdirSync(options.output, { recursive: true, mode: 0o700 });
  const evidencePath = join(options.output, "evidence.json");
  try {
    const hostOverride = createSmokeHostEnvironment({ thirdReview: loadTrustedThirdReviewConfig(), outputRoot: options.output, sourceRoot: process.env.THIRD_REVIEW_SOURCE_ROOT ?? null });
    const state = JSON.parse(readFileSync(join(options.task, "worktree.json"), "utf8"));
    requireValue(resolve(state.worktree_root) === options.source, "AUDIT_E2E_SOURCE_MISMATCH");
    const baseCommit = state.trusted_base_commit; const baseTree = state.trusted_base_tree;
    requireValue(git(options.source, ["rev-parse", `${baseCommit}^{tree}`]) === baseTree, "AUDIT_E2E_TRUSTED_BASE_MISMATCH");
    const auditTree = captureWorktreeTree(options.source, { baseTree });
    const auditMaterial = buildTreeMaterial(options.source, { baseTree, snapshotTree: auditTree });

    const target = join(options.output, "target-repository"); const mirror = join(options.output, "audit-worktree");
    execFileSync("git", ["clone", "-q", "--no-local", options.source, target]);
    git(target, ["worktree", "add", "-q", "-b", "workflowhub/audit-review", mirror, baseCommit]);
    const patch = execFileSync("git", ["diff", "--binary", "--full-index", baseCommit], { cwd: options.source });
    if (patch.length) execFileSync("git", ["apply", "--binary", "-"], { cwd: mirror, input: patch });
    const untracked = copyUntracked(options.source, mirror);
    const mirroredAuditTree = captureWorktreeTree(mirror, { baseTree });
    requireValue(mirroredAuditTree === auditTree, "AUDIT_E2E_MIRROR_TREE_MISMATCH");

    const markers = ["AUDIT_SCOPE_BEGIN_MARKER", "AUDIT_SCOPE_MIDDLE_MARKER", "AUDIT_SCOPE_END_MARKER"];
    for (const [name, marker] of [["000-review-e2e-begin.txt", markers[0]], ["m-review-e2e-middle.txt", markers[1]], ["zzz-review-e2e-end.txt", markers[2]]]) writeFileSync(join(mirror, name), `${marker}\n`);
    const deliveryTree = captureWorktreeTree(mirror, { baseTree }); const deliveryMaterial = buildTreeMaterial(mirror, { baseTree, snapshotTree: deliveryTree });
    requireValue(deliveryMaterial.changed_files.length === auditMaterial.changed_files.length + markers.length, "AUDIT_E2E_SCOPE_MISMATCH: marker preparation changed unexpected files");
    requireValue(markersSpanDiff(deliveryMaterial.unified_diff, markers), "AUDIT_E2E_MARKER_POSITION_INVALID: marker preparation did not cover the beginning, middle, and end of changes.diff");
    const tracking = join(options.output, "tracking"); const taskId = "audit-e2e";
    writeJson(join(tracking, taskId, "worktree.json"), { target_repo_root: target, worktree_root: mirror, branch: "workflowhub/audit-review", created_by_stage: "make-decision", push_policy: "verify-code-only", status: "active", trusted_base_commit: baseCommit, trusted_base_tree: baseTree, trusted_base_source: "audit-e2e-mirror" });
    writeFileSync(join(tracking, taskId, "test-strategy.md"), "# Audit E2E test strategy\n\nThe temporary mirror tree must match the live audit tree before marker injection. Kimi and OpenCode must read all three markers from the frozen file-only packet.\n");
    for (const name of ["requirements-ledger.json", "requirements-coverage.json"]) copyFileSync(join(options.task, name), join(tracking, taskId, name));
    const resolution = resolveRequiredSkills({ stage: "build-code", reviewTrack: null });
    const input = { task_id: taskId, stage: "build-code", review_flow_id: "full-scope", host_provider: "codex", provider_allowlist: ["kimi", "opencode"], task_tracking_root: tracking, packet: { version: "review-packet.v1", stage: "build-code", review_track: null, round_kind: "initial", baseline_packet_hash: null, raw_requirement: `Review the complete audit scope and quote ${markers.join(", ")} from changes.diff.`, acceptance_design_excerpt: "The complete host-captured audit diff and all three marker positions must be reviewed.", test_evidence: [
      { fact_id: "audit-e2e-preflight", kind: "artifact", source: "test-strategy.md", captured_at: new Date().toISOString(), sha256: hash(readFileSync(join(tracking, taskId, "test-strategy.md"))), status: "passed" },
      { fact_id: "requirements-ledger", kind: "artifact", source: "requirements-ledger.json", captured_at: new Date().toISOString(), sha256: hash(readFileSync(join(tracking, taskId, "requirements-ledger.json"))), status: "passed" },
      { fact_id: "requirements-coverage", kind: "artifact", source: "requirements-coverage.json", captured_at: new Date().toISOString(), sha256: hash(readFileSync(join(tracking, taskId, "requirements-coverage.json"))), status: "passed" },
    ], host_verified_facts: [{ fact_id: "audit-scope", kind: "source-tree", source: "host reconciliation", captured_at: new Date().toISOString(), sha256: hash(auditTree), value: { reconciled_files: auditMaterial.changed_files.length } }], contract_hash: projectStageContract("build-code").contractHash, skill_bundle_hash: resolution.skillBundleHash } };
    const inputPath = join(options.output, "input.json"); writeJson(inputPath, input);
    const cli = spawnSync(process.execPath, [join(repository, "skills/wh-review/scripts/wh-review-cli.mjs"), "run", inputPath], { encoding: "utf8", env: hostOverride.env ?? process.env });
    writeJson(join(options.output, "execution.json"), { status: cli.status, stdout: cli.stdout, stderr: cli.stderr });
    requireValue(cli.status === 0, `AUDIT_E2E_CLI_FAILED: ${cli.stderr.trim()}`);
    const round = join(tracking, taskId, "reviews", "private", "round-build-code-full-scope-1");
    const receiptPath = join(round, "round-receipt.json"); const packetPath = join(round, "review-packet.json");
    const receipt = JSON.parse(readFileSync(receiptPath, "utf8")); const packet = JSON.parse(readFileSync(packetPath, "utf8"));
    const providers = assertAuditEvidence({ receipt, packet, auditScopeFiles: auditMaterial.changed_files.length, markers });
    requireValue(packet.source_revision.snapshot_tree === deliveryTree, "AUDIT_E2E_PACKET_TREE_MISMATCH");
    const evidence = { status: "PASS", approved_base_commit: baseCommit, approved_base_tree: baseTree, audit_captured_tree: auditTree, delivered_tree: deliveryTree, audit_scope_files: auditMaterial.changed_files.length, delivered_files: packet.changed_files.length, copied_untracked: untracked, packet_hash: packet.packet_hash, diff_sha256: packet.diff_sha256, runtime_id: receipt.runtime_id, providers, receipt: receiptPath, packet: packetPath, input: inputPath };
    writeJson(evidencePath, evidence); process.stdout.write(`${JSON.stringify({ status: "PASS", evidence: evidencePath })}\n`);
  } catch (error) { writeJson(evidencePath, { status: "FAIL", error: String(error?.message ?? error) }); process.stderr.write(`${JSON.stringify({ status: "FAIL", evidence: evidencePath, error: String(error?.message ?? error) })}\n`); process.exitCode = 1; }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
