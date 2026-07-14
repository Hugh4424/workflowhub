import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { projectStageContract, assertKnownStage, assertReviewTrack, assertSafeReviewFlowId, assertSafeTaskId, isDownstreamReviewStage, reviewFlowStorageKey, reviewStageStorageKey, taskRoot } from "./lib/safe-id.mjs";
import { validateReviewerOutput } from "./reviewer-output-validator.mjs";
import { resolveRequiredSkills } from "./required-skill-resolver.mjs";
import { buildContinuationDelta, continuationPrompt, initialPrompt } from "./review-prompt.mjs";
import { projectPublicReviewCore } from "./public-review-projection.mjs";
import { SchemaValidationError, validateSchema } from "./schema-validator.mjs";
import { reconcileFindingState, aggregateMakeDecisionTracks, isBlocking, mergeCrossStageCarryovers, validateClosureBundle } from "./finding-state.mjs";
import { canonicalPacketJson as canonical, reviewManifestHash, reviewPacketHash } from "./review-packet-integrity.mjs";
import { buildTreeMaterial, captureWorktreeTree, capturedHead, deleteReviewTreeRef, headTree, readReviewTreeRef, updateReviewTreeRef } from "./source-tree.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const safeJson = (value) => JSON.stringify(value, null, 2) + "\n";
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const cancellationSources = new Set(["user", "workflow_shutdown", "broker_idle_timeout", "broker_max_duration"]);
export function aggregateMakeDecisionReviewTracks(input) { return aggregateMakeDecisionTracks(input); }
function atomic(path, value, mode = 0o600) { mkdirSync(dirname(path), { recursive: true, mode: 0o700 }); const temp = `${path}.${process.pid}.tmp`; writeFileSync(temp, value, { mode }); renameSync(temp, path); }
function writeImmutable(path, value) {
  const encoded = safeJson(value); mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  if (existsSync(path)) {
    if (readFileSync(path, "utf8") !== encoded) throw new Error(`immutable reset marker already exists: ${path}`);
    return;
  }
  try { writeFileSync(path, encoded, { mode: 0o600, flag: "wx" }); }
  catch (error) {
    if (error?.code !== "EEXIST" || readFileSync(path, "utf8") !== encoded) throw error;
  }
}
function parseOutput(value) {
  let text = String(value ?? "").trim();
  const fence = text.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i);
  if (fence) text = fence[1].trim();
  try { return { ok: true, value: JSON.parse(text) }; } catch { return { ok: false }; }
}
function privateFileHash(directory, ref, expectedHash) {
  if (typeof ref !== "string" || !ref || typeof expectedHash !== "string" || !/^[a-f0-9]{64}$/i.test(expectedHash)) return null;
  const root = resolve(directory); const target = resolve(ref);
  if (!target.startsWith(`${root}/`)) return null;
  try {
    const bytes = readFileSync(target);
    return sha(bytes) === expectedHash.toLowerCase() ? target : null;
  } catch { return null; }
}
function packetHash(packet) { return reviewPacketHash(packet); }
function attachmentRecords(entries) { return entries.map(({ destination: target, sha256, size, embed }) => ({ target, sha256, size, embed })); }
function canonicalInnerManifestHash(manifest) { const { inner_manifest_hash: ignored, ...value } = manifest; return sha(canonical(value)); }
function canonicalDeliveryManifestHash(bundleId, files, deliveryMode) { return sha(canonical({ version: 1, bundle_id: bundleId, delivery_mode: deliveryMode, files: files.filter((item) => item.target !== "manifest.json").map(({ target, sha256, size, embed }) => ({ target, sha256, size, embed })) })); }
function canonicalMaterialManifestHash(bundleId, files) { return sha(canonical({ version: 1, bundle_id: bundleId, files: files.filter((item) => !["review-packet.v1.json", "manifest.json"].includes(item.target)).map(({ target, sha256, size, embed }) => ({ target, sha256, size, embed })) })); }
function safeRelativePath(value) { return typeof value === "string" && value.length > 0 && !value.includes("\\") && !value.startsWith("/") && !value.split("/").some((part) => !part || part === "." || part === ".."); }
function findAbsolutePathLiteral(value, trail = "packet") {
  if (typeof value === "string") {
    // A slash is not sufficient: diffs and markdown legitimately contain
    // relative paths. These forms are unambiguously host/Windows paths.
    const raw = value.replace(/^(?:---|\+\+\+) \/dev\/null$/gm, "");
    // Provider material may reference only http(s). Any other URI scheme can
    // encode a local path (file://, vscode://file/…, and Windows variants).
    const uri = raw.match(/\b([A-Za-z][A-Za-z0-9+.-]*):(?=\/\/|\/)/);
    if (uri && !["http", "https"].includes(uri[1].toLowerCase())) return { trail, literal: uri[0] };
    const match = raw.match(/(?:^|[\s"'`=:(+])(?:\/[A-Za-z0-9._-]+){2,}|(?:^|[^A-Za-z0-9_])[A-Za-z]:[\\/]|\\\\[A-Za-z0-9._-]+[\\/]/m);
    return match ? { trail, literal: match[0].trim() } : null;
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) { const found = findAbsolutePathLiteral(value[index], `${trail}[${index}]`); if (found) return found; }
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) { const found = findAbsolutePathLiteral(child, `${trail}.${key}`); if (found) return found; }
  }
  return null;
}
function addedDeltaLineKeys(unifiedDiff) {
  const keys = new Set();
  let file = null; let nextLine = null;
  for (const line of String(unifiedDiff ?? "").split("\n")) {
    if (line.startsWith("+++ ")) {
      const candidate = line.slice(4).replace(/^b\//, "");
      file = candidate === "/dev/null" || !safeRelativePath(candidate) ? null : candidate;
      nextLine = null;
      continue;
    }
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) { nextLine = Number(hunk[1]); continue; }
    if (nextLine === null) continue;
    if (line.startsWith("+")) { if (file) keys.add(`${file}\0${nextLine}`); nextLine += 1; continue; }
    if (line.startsWith(" ")) { nextLine += 1; continue; }
    if (line.startsWith("-")) continue;
    if (line.startsWith("\\ No newline")) continue;
  }
  return keys;
}
function sealPacket(packet) {
  packet.diff_sha256 ??= sha(packet.unified_diff);
  const sourceManifestHash = reviewManifestHash(packet);
  packet.source_manifest_hash ??= sourceManifestHash;
  if (packet.source_manifest_hash !== sourceManifestHash) throw new Error("source_manifest_hash mismatch");
  // Before attachment freezing this is the source-material binding. The
  // provider packet's manifest_hash is replaced below with the triad material
  // manifest required by the broker contract.
  packet.manifest_hash = sourceManifestHash;
  packet.packet_hash ??= "0".repeat(64);
  validateSchema("review-packet", packet);
  const diff = sha(packet.unified_diff);
  if (packet.diff_sha256 && packet.diff_sha256 !== diff) throw new Error("diff_sha256 mismatch");
  packet.diff_sha256 = diff;
  // Git owns diff syntax (multiple hunks, mode/index records, binary patches,
  // and quoted paths); this facade receives it only from source-tree.mjs.
  for (const entry of packet.changed_files) {
    if (!entry || !safeRelativePath(entry.path) || !["added", "modified", "deleted", "renamed"].includes(entry.status)) throw new Error("invalid changed_files entry");
    const needsCurrent = entry.status !== "deleted";
    if (needsCurrent && (!/^[a-f0-9]{64}$/.test(entry.sha256 ?? "") || !Number.isSafeInteger(entry.size) || entry.size < 0)) throw new Error("invalid changed_files current snapshot");
    if (["modified", "deleted", "renamed"].includes(entry.status) && (!/^[a-f0-9]{64}$/.test(entry.old_sha256 ?? "") || !Number.isSafeInteger(entry.old_size) || entry.old_size < 0)) throw new Error("invalid changed_files base snapshot");
    if (entry.status === "renamed" && !safeRelativePath(entry.old_path)) throw new Error("renamed changed_files entry requires old_path");
  }
  packet.packet_hash = packetHash(packet);
  return packet;
}
const sourceOwnedFields = new Set(["source_revision", "unified_diff", "changed_files", "diff_sha256", "packet_hash", "source_manifest_hash", "manifest_hash", "repository_root", "repositoryRoot", "changed_file_root", "changedFileRoot"]);
function rejectCallerSourceFields(value, scope = "caller input") {
  const fields = Object.keys(value ?? {}).filter((field) => sourceOwnedFields.has(field));
  if (fields.length) throw new Error(`SOURCE_FIELDS_FORBIDDEN: ${scope} cannot provide ${fields.join(", ")}`);
}
function buildHostWorktreeSource(root, { baseTree, excludePaths } = {}) {
  const base_tree = baseTree ?? headTree(root);
  const snapshot_tree = captureWorktreeTree(root, { baseTree: base_tree, excludePaths });
  const material = buildTreeMaterial(root, { baseTree: base_tree, snapshotTree: snapshot_tree });
  return { ...material, source_revision: { ...material.source_revision, captured_head: capturedHead(root) } };
}
function internalLedgerExclusion(sourceRoot, taskTrackingRoot, taskId) {
  const candidate = relative(resolve(sourceRoot), taskRoot(taskTrackingRoot, taskId));
  // A task directory can also contain user-owned source. Exclude only the
  // facade's ledger beneath it, never the whole task directory.
  return safeRelativePath(candidate) ? [join(candidate, "reviews")] : [];
}
function processStartIdentity(pid) {
  try {
    const value = String(execFileSync("ps", ["-o", "lstart=", "-p", String(pid)], { encoding: "utf8" })).trim();
    return value || null;
  } catch { return null; }
}
function bundleHash(resolution) { return sha(canonical(resolution.definitions.map(({ name, bundle }) => ({ name, sha256: bundle.sha256 })))); }
function publicError(item) { return item?.error?.code ?? item?.error?.message ?? "PROVIDER_FAILED"; }
function classifyTransport(item) {
  if (item?.status === "cancelled") return "cancelled";
  const code = publicError(item);
  if (/AUTH/i.test(code)) return "authentication_failed";
  if (/TIMEOUT/i.test(code)) return "timeout";
  return item?.status === "completed" ? "completed" : "failed";
}
function deriveHumanGates(providerOutcomes) {
  return (providerOutcomes ?? []).filter((item) => item?.transport_status === "completed" && item.packet_status === "complete" && item.business_valid === true && item.semantic_verdict === "escalate_to_human").map((item) => ({ provider: item.provider, verdict: item.semantic_verdict, summary: item.summary }));
}
function verifiedHumanGates(providerOutcomes, declaredGates) {
  const derived = deriveHumanGates(providerOutcomes);
  if (declaredGates !== undefined && canonical(declaredGates) !== canonical(derived)) throw new Error("human gate provenance does not match provider outcomes");
  return derived;
}
function findingId(finding) { return sha(`${finding.file}\0${finding.line}\0${finding.rule_id}\0${finding.issue.trim().toLowerCase()}`); }
function projectFinding(finding, provider) {
  if (!safeRelativePath(finding.file)) throw new Error("finding file must be repo-relative");
  const projected = { file: finding.file, line: finding.line, rule_id: finding.rule_id, severity: finding.severity, issue: finding.issue, evidence: finding.evidence, suggested_fix: finding.suggested_fix };
  return { ...projected, finding_id: findingId(projected), providers: [provider] };
}
function exactClosureEvidence(findings, supplied, deltaSource, contractHardIds) {
  if (findings.length === 0 && supplied === undefined) return { items: [], unverifiedBlockingIds: [] };
  if (!Array.isArray(supplied)) throw new Error("closure_evidence is required for every previous finding");
  const byId = new Map(findings.map((finding) => [finding.finding_id, finding])); const required = new Set(byId.keys()); const seen = new Set(); const unverifiedBlockingIds = [];
  for (const item of supplied) {
    if (!item || typeof item.finding_id !== "string" || typeof item.evidence !== "string" || !item.evidence.trim()) throw new Error("closure_evidence item is invalid");
    if (seen.has(item.finding_id)) throw new Error(`closure_evidence has duplicate finding id: ${item.finding_id}`);
    if (!required.has(item.finding_id)) throw new Error(`closure_evidence has unknown finding id: ${item.finding_id}`);
    seen.add(item.finding_id);
    const checked = validateClosureBundle({ finding: byId.get(item.finding_id), closure: item, delta: deltaSource, contractHardIds });
    if (!checked.valid) unverifiedBlockingIds.push({ finding_id: item.finding_id, reason: checked.reason });
  }
  const missing = [...required].filter((id) => !seen.has(id));
  if (missing.length) throw new Error(`closure_evidence is missing finding ids: ${missing.join(",")}`);
  return { items: supplied.map((item) => structuredClone(item)), unverifiedBlockingIds };
}
function trustedPublicCore(taskTrackingRoot, taskId, coreHash, role = "source") {
  if (!/^[a-f0-9]{64}$/.test(coreHash ?? "")) throw new Error(`cross_stage_carryovers requires ${role}_core_receipt_hash`);
  const path = join(taskRoot(taskTrackingRoot, taskId), "reviews", "core-receipts", `${coreHash}.json`);
  if (!existsSync(path)) throw new Error(`cross_stage_carryovers ${role} core receipt is unavailable`);
  const bytes = readFileSync(path);
  if (sha(bytes) !== coreHash) throw new Error(`cross_stage_carryovers ${role} core receipt hash mismatch`);
  try { return JSON.parse(bytes); }
  catch { throw new Error(`cross_stage_carryovers ${role} core receipt is invalid JSON`); }
}
function checkedCarryovers(value, previousFindings, { taskTrackingRoot, taskId, stage } = {}) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error("cross_stage_carryovers must be an array");
  const oldIds = new Set(previousFindings.map((finding) => finding.finding_id)); const seen = new Set();
  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item) || Object.hasOwn(item, "finding_id") || oldIds.has(item.carryover_id)) throw new Error("cross_stage_carryovers cannot contain a previous finding");
    const allowed = new Set(["carryover_id", "source_stage", "source_core_receipt_hash", "closure_core_receipt_hash", "status", "evidence"]);
    if (Object.keys(item).some((key) => !allowed.has(key)) || typeof item.carryover_id !== "string" || !item.carryover_id || seen.has(item.carryover_id)
      || !["open", "deferred", "closed"].includes(item.status) || typeof item.source_stage !== "string" || !item.source_stage || typeof item.evidence !== "string" || !item.evidence.trim()) throw new Error("cross_stage_carryovers requires explicit carryover_id, source_stage, source_core_receipt_hash, status, and evidence fields");
    const core = trustedPublicCore(taskTrackingRoot, taskId, item.source_core_receipt_hash);
    const source = core?.intent?.stage === item.source_stage && isDownstreamReviewStage(item.source_stage, stage)
      ? (core.dispositions ?? []).find((disposition) => disposition?.finding_id === item.carryover_id && disposition?.action === "defer")
      : null;
    if (!source || source.evidence !== item.evidence) throw new Error("cross_stage_carryovers source stage, hash, or deferred closure binding is invalid");
    if (item.status === "closed") {
      const closure = trustedPublicCore(taskTrackingRoot, taskId, item.closure_core_receipt_hash, "closure");
      const closureFinding = (closure.merged_findings ?? []).find((finding) => finding?.finding_id === item.carryover_id);
      const stillOpen = closureFinding !== undefined && closureFinding?.status !== "closed";
      if (closure?.intent?.stage !== item.source_stage || closure.intent?.previous_core_receipt_hash !== item.source_core_receipt_hash
        || closure.semantic_verdict !== "pass" || closure.needs_human !== false || stillOpen) throw new Error("cross_stage_carryovers trusted closure receipt does not close the deferred carryover");
    } else if (item.closure_core_receipt_hash !== undefined) throw new Error("cross_stage_carryovers closure_core_receipt_hash is only valid for closed carryovers");
    seen.add(item.carryover_id);
    return { carryover_id: item.carryover_id, source_stage: item.source_stage, source_core_receipt_hash: item.source_core_receipt_hash, ...(item.status === "closed" ? { closure_core_receipt_hash: item.closure_core_receipt_hash } : {}), status: item.status, evidence: source.evidence };
  });
}

export class ReviewRoundFacade {
  constructor({ taskTrackingRoot, sourceRoot = taskTrackingRoot, broker, skillsRoot, now = () => Date.now(), continuationPromptMaxBytes = 524288, initialPromptMaxBytes = 524288, maxDispositionAttempts = 3, requiredSkillResolver = resolveRequiredSkills, faultInjector = () => {} } = {}) {
    if (!taskTrackingRoot) throw new TypeError("taskTrackingRoot is required"); if (!broker?.run) throw new TypeError("broker.run is required");
    if (!Number.isSafeInteger(continuationPromptMaxBytes) || continuationPromptMaxBytes < 1) throw new TypeError("continuationPromptMaxBytes must be a positive integer");
    if (!Number.isSafeInteger(initialPromptMaxBytes) || initialPromptMaxBytes < 1) throw new TypeError("initialPromptMaxBytes must be a positive integer");
    if (!Number.isSafeInteger(maxDispositionAttempts) || maxDispositionAttempts < 1) throw new TypeError("maxDispositionAttempts must be a positive integer");
    if (typeof requiredSkillResolver !== "function") throw new TypeError("requiredSkillResolver must be a function");
    if (typeof faultInjector !== "function") throw new TypeError("faultInjector must be a function");
    this.taskTrackingRoot = resolve(taskTrackingRoot); this.sourceRoot = resolve(sourceRoot); this.broker = broker; this.skillsRoot = resolve(skillsRoot ?? repositoryRoot); this.now = now;
    this.continuationPromptMaxBytes = continuationPromptMaxBytes; this.initialPromptMaxBytes = initialPromptMaxBytes; this.maxDispositionAttempts = maxDispositionAttempts; this.requiredSkillResolver = requiredSkillResolver; this.faultInjector = faultInjector;
  }
  #root(intent) { return join(taskRoot(this.taskTrackingRoot, intent.task_id), "reviews", "private", `round-${reviewFlowStorageKey(intent.stage, intent.review_track, intent.review_flow_id)}-${intent.business_round}`); }
  #flow(intent) { return join(taskRoot(this.taskTrackingRoot, intent.task_id), "reviews", "private", "flows", `${reviewFlowStorageKey(intent.stage, intent.review_track, intent.review_flow_id)}.json`); }
  #treeRef(intent) { return `refs/workflowhub/review/${intent.task_id}/${reviewStageStorageKey(intent.stage, intent.review_track)}/${intent.review_flow_id}`; }
  #sourceContext(taskId) { return join(taskRoot(this.taskTrackingRoot, taskId), "reviews", "private", "source-context.json"); }
  #readSourceContext(taskId) {
    const path = this.#sourceContext(taskId); if (!existsSync(path)) return null;
    let context; try { context = JSON.parse(readFileSync(path, "utf8")); } catch { throw new Error("task source context is invalid"); }
    if (!(context?.version === 1 && /^[a-f0-9]{40,64}$/.test(context.initial_tree ?? "") && (context.last_approved_tree === null || /^[a-f0-9]{40,64}$/.test(context.last_approved_tree ?? "")))) throw new Error("task source context is invalid");
    return context;
  }
  #recordInitialTree(taskId, initialTree) {
    const existing = this.#readSourceContext(taskId); if (existing) return existing;
    const context = { version: 1, initial_tree: initialTree, last_approved_tree: null };
    this.faultInjector("before-source-context-write", context); atomic(this.#sourceContext(taskId), safeJson(context)); return context;
  }
  #recordLastApprovedTree(taskId, tree) {
    const existing = this.#readSourceContext(taskId);
    if (!existing) throw new Error("task source context is missing");
    const context = { ...existing, last_approved_tree: tree };
    this.faultInjector("before-source-context-write", context); atomic(this.#sourceContext(taskId), safeJson(context)); return context;
  }
  #resetApproval(intent) { return join(taskRoot(this.taskTrackingRoot, intent.task_id), "reviews", "private", "flows", `${reviewFlowStorageKey(intent.stage, intent.review_track, intent.review_flow_id)}.reset-approval.json`); }
  #lock(intent) {
    const name = intent.stage === "make-decision" ? `${intent.task_id}-${reviewStageStorageKey(intent.stage, intent.review_track)}.lock` : `${intent.task_id}.lock`;
    return join(taskRoot(this.taskTrackingRoot, intent.task_id), "reviews", "private", "flows", name);
  }
  #taskProjectionLock(taskId, purpose) {
    return this.#acquireLock({ task_id: taskId, stage: "task-projection", review_track: null, idempotency_key: sha(`task-projection\0${taskId}\0${purpose}`) });
  }
  #publicPaths(intent) {
    const reviews = join(taskRoot(this.taskTrackingRoot, intent.task_id), "reviews");
    const flow = reviewFlowStorageKey(intent.stage, intent.review_track, intent.review_flow_id);
    const stage = reviewStageStorageKey(intent.stage, intent.review_track);
    if (intent.stage !== "make-decision") {
      return { reviews, reportPath: join(reviews, `${flow}.md`), indexPath: join(reviews, "report-index.json"), stageResultPath: join(reviews, `stage-result-${stage}.json`) };
    }
    return { reviews, reportPath: join(reviews, `${flow}.md`), indexPath: join(reviews, `report-index-${stage}.json`), stageResultPath: join(reviews, `stage-result-${stage}.json`) };
  }
  #publicCorePath(intent, coreHash) {
    return join(taskRoot(this.taskTrackingRoot, intent.task_id), "reviews", "core-receipts", `${coreHash}.json`);
  }
  #projectionGuardPath(intent) {
    const key = reviewFlowStorageKey(intent.stage, intent.review_track, intent.review_flow_id);
    return join(taskRoot(this.taskTrackingRoot, intent.task_id), "reviews", `projection-pending-${key}.json`);
  }
  #projectionPending(intent) {
    return { version: 1, status: "pending", task_id: intent.task_id, stage: intent.stage, review_track: intent.review_track ?? null, review_flow_id: intent.review_flow_id, needs_human: true, guard_ref: relative(taskRoot(this.taskTrackingRoot, intent.task_id), this.#projectionGuardPath(intent)) };
  }
  #readVerifiedProjectionGuard(intent) {
    const path = this.#projectionGuardPath(intent);
    if (!existsSync(path)) throw new Error("PROJECTION_RECOVERY_GUARD_MISSING: private projection state has no public guard");
    let saved;
    try { saved = JSON.parse(readFileSync(path, "utf8")); }
    catch { throw new Error("PROJECTION_RECOVERY_GUARD_INVALID: projection guard is invalid JSON"); }
    const pending = this.#projectionPending(intent);
    if (canonical(saved) !== canonical(pending)) throw new Error("PROJECTION_RECOVERY_GUARD_MISMATCH: projection guard does not bind this flow");
    return { path, pending };
  }
  #readOrphanProjectionGuard(path, taskId) {
    let saved;
    try { saved = JSON.parse(readFileSync(path, "utf8")); }
    catch { throw new Error("PROJECTION_RECOVERY_GUARD_INVALID: orphan projection guard is invalid JSON"); }
    if (saved?.task_id !== taskId) throw new Error("PROJECTION_RECOVERY_GUARD_TASK_MISMATCH: orphan projection guard belongs to another task");
    try { assertSafeTaskId(saved.task_id); assertKnownStage(saved.stage); assertReviewTrack(saved.stage, saved.review_track ?? null); assertSafeReviewFlowId(saved.review_flow_id); }
    catch { throw new Error("PROJECTION_RECOVERY_GUARD_INVALID: orphan projection guard identity is invalid"); }
    if (canonical(saved) !== canonical(this.#projectionPending(saved))) throw new Error("PROJECTION_RECOVERY_GUARD_MISMATCH: orphan projection guard does not bind its flow");
    return saved;
  }
  #publicCoreMatchesIntent(intent, coreHash) {
    if (typeof coreHash !== "string" || !/^[a-f0-9]{64}$/i.test(coreHash)) throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: public stage-result has an invalid core hash");
    const path = this.#publicCorePath(intent, coreHash);
    if (!existsSync(path)) throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: public stage-result core receipt is missing");
    const bytes = readFileSync(path);
    if (sha(bytes) !== coreHash) throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: public core receipt hash mismatch");
    let core;
    try { core = JSON.parse(bytes); }
    catch { throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: public core receipt is invalid JSON"); }
    const coreIntent = core?.intent;
    const sameFlow = coreIntent?.task_id === intent.task_id && coreIntent.stage === intent.stage && (coreIntent.review_track ?? null) === (intent.review_track ?? null) && coreIntent.review_flow_id === intent.review_flow_id;
    if (!sameFlow) return false;
    if (!Number.isSafeInteger(coreIntent.business_round) || coreIntent.business_round <= 0) throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: public core receipt round is invalid");
    return true;
  }
  #publicIndexMatchesIntent(intent, indexPath) {
    if (!existsSync(indexPath)) return false;
    let index;
    try { index = JSON.parse(readFileSync(indexPath, "utf8")); }
    catch { throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: report index is invalid JSON"); }
    // report-index.json is shared by stages. Another stage is unrelated, but
    // an index for this stage must name this exact track (including null for
    // ordinary stages), otherwise it is a corrupted current-stage artifact.
    if (index?.stage !== intent.stage) return false;
    if ((index.review_track ?? null) !== (intent.review_track ?? null)) throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: report index does not bind this stage track");
    return this.#publicCoreMatchesIntent(intent, index.core_receipt_hash);
  }
  #aggregateCoreMatchesIntent(intent, coreHash) {
    if (typeof coreHash !== "string" || !/^[a-f0-9]{64}$/i.test(coreHash)) throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: aggregate artifact has an invalid core hash");
    const { reviews } = this.#publicPaths(intent); const group = `make-decision-${intent.review_flow_id}`;
    const corePath = join(reviews, `${group}-aggregate-core-receipt.json`);
    if (!existsSync(corePath) || sha(readFileSync(corePath)) !== coreHash) throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: aggregate core receipt hash mismatch");
    let core;
    try { core = JSON.parse(readFileSync(corePath, "utf8")); }
    catch { throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: aggregate core receipt is invalid JSON"); }
    if (core?.stage !== "make-decision" || core.review_flow_id !== intent.review_flow_id || canonical(core.review_tracks) !== canonical(["direction", "detail"])) throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: aggregate core receipt does not bind this flow");
    return true;
  }
  #aggregateProjectionMatchesIntent(intent) {
    const { reviews } = this.#publicPaths(intent);
    const group = `make-decision-${intent.review_flow_id}`;
    const stagePath = join(reviews, `stage-result-${group}.json`);
    if (!existsSync(stagePath)) return false;
    let stageResult;
    try { stageResult = JSON.parse(readFileSync(stagePath, "utf8")); }
    catch { throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: aggregate stage-result is invalid JSON"); }
    if (stageResult?.stage !== "make-decision" || stageResult.review_flow_id !== intent.review_flow_id || canonical(stageResult.review_tracks) !== canonical(["direction", "detail"])) throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: aggregate stage-result does not bind this flow");
    return this.#aggregateCoreMatchesIntent(intent, stageResult.core_receipt_hash);
  }
  #aggregateIndexMatchesIntent(intent) {
    const { reviews } = this.#publicPaths(intent); const group = `make-decision-${intent.review_flow_id}`;
    const indexPath = join(reviews, `report-index-${group}.json`);
    if (!existsSync(indexPath)) return false;
    let index;
    try { index = JSON.parse(readFileSync(indexPath, "utf8")); }
    catch { throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: aggregate report index is invalid JSON"); }
    if (index?.stage !== "make-decision" || index.review_flow_id !== intent.review_flow_id || canonical(index.review_tracks) !== canonical(["direction", "detail"])) throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: aggregate report index does not bind this flow");
    return this.#aggregateCoreMatchesIntent(intent, index.core_receipt_hash);
  }
  #hasPublicProjection(intent) {
    const { reviews, reportPath, indexPath, stageResultPath } = this.#publicPaths(intent);
    // A per-flow report path itself encodes the complete flow identity. The
    // shared stage-result and report-index paths do not, so only a core hash
    // binding can make them evidence of this pending guard.
    if (this.#publicIndexMatchesIntent(intent, indexPath)) return true;
    if (existsSync(reportPath)) return true;
    if (existsSync(stageResultPath)) {
      let stageResult;
      try { stageResult = JSON.parse(readFileSync(stageResultPath, "utf8")); }
      catch { throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: stage-result is invalid JSON"); }
      if (stageResult?.stage !== intent.stage || (stageResult.review_track ?? null) !== (intent.review_track ?? null)) throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: stage-result does not bind this stage track");
      if (this.#publicCoreMatchesIntent(intent, stageResult.core_receipt_hash)) return true;
    }
    if (intent.stage === "make-decision") {
      const group = `make-decision-${intent.review_flow_id}`;
      if (this.#aggregateIndexMatchesIntent(intent)) return true;
      if (existsSync(join(reviews, `${group}-aggregate.md`))) return true;
      if (this.#aggregateProjectionMatchesIntent(intent)) return true;
    }
    const cores = join(reviews, "core-receipts");
    if (!existsSync(cores)) return false;
    return readdirSync(cores).some((name) => {
      if (!name.endsWith(".json")) return false;
      const path = join(cores, name); let core;
      try { core = JSON.parse(readFileSync(path, "utf8")); }
      catch { return false; }
      const coreIntent = core?.intent;
      const sameFlow = coreIntent?.task_id === intent.task_id && coreIntent.stage === intent.stage && (coreIntent.review_track ?? null) === (intent.review_track ?? null) && coreIntent.review_flow_id === intent.review_flow_id;
      if (!sameFlow) return false;
      const coreHash = name.slice(0, -5);
      if (!/^[a-f0-9]{64}$/i.test(coreHash) || sha(readFileSync(path)) !== coreHash) throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: public core receipt hash mismatch");
      if (!Number.isSafeInteger(coreIntent.business_round) || coreIntent.business_round <= 0) throw new Error("PROJECTION_RECOVERY_PUBLIC_ARTIFACT_INVALID: public core receipt round is invalid");
      return true;
    });
  }
  #ensureProjectionGuard(intent) {
    const pending = this.#projectionPending(intent); const path = this.#projectionGuardPath(intent);
    if (existsSync(path)) return this.#readVerifiedProjectionGuard(intent).pending;
    atomic(path, safeJson(pending), 0o644); return pending;
  }
  #completeProjection(intent, receiptPath) {
    const { path: guard } = this.#readVerifiedProjectionGuard(intent);
    const flow = this.#readFlow(intent);
    if (!flow) throw new Error("PROJECTION_RECOVERY_FLOW_MISSING: cannot complete projection without flow");
    const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
    if (receipt.projection_pending !== undefined) {
      const { projection_pending, ...healedReceipt } = receipt;
      this.#updateReceiptAndFlow(intent, receiptPath, healedReceipt);
    }
    const healedFlow = this.#readFlow(intent);
    if (healedFlow?.projection_pending !== undefined) {
      const { projection_pending, ...rest } = healedFlow;
      this.#writeFlow(intent, rest);
    }
    rmSync(guard, { force: true });
  }
  #readFlow(intent) { const path = this.#flow(intent); return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null; }
  #writeFlow(intent, value) { this.faultInjector("before-flow-write", value); atomic(this.#flow(intent), safeJson(value)); }

  prepare(input) {
    assertSafeTaskId(input.task_id); assertKnownStage(input.stage); assertReviewTrack(input.stage, input.review_track ?? null); assertSafeReviewFlowId(input.review_flow_id);
    rejectCallerSourceFields(input);
    rejectCallerSourceFields(input.packet, "caller packet");
    if (input.source_snapshot !== undefined || input.sourceSnapshot !== undefined) throw new Error("source_snapshot is not accepted; wh-review builds source evidence from host git revisions");
    if (input.provider_capabilities !== undefined || input.providerCapabilities !== undefined) throw new Error("provider_capabilities are broker-owned; caller capability assertions are rejected");
    if (input.attachment_delivery !== undefined || input.attachmentDelivery !== undefined) throw new Error("attachment_delivery comes only from stage-skill-plan resolution; caller delivery assertions are rejected");
    if (input.allow_contract_hash_override !== undefined) throw new Error("contract hash override is rejected; packet hash must bind the frozen projected contract");
    const lock = this.#acquireLock({ task_id: input.task_id, stage: input.stage, review_track: input.review_track ?? null, idempotency_key: sha(`prepare\0${input.task_id}\0${input.stage}\0${input.review_track ?? "default"}\0${input.review_flow_id}`) });
    return this.#prepareUnderLock(input, lock);
  }

  async #prepareUnderLock(input, lock) {
    // Ordinary stages already hold the task-wide lock as their flow lock.
    // make-decision has per-track flow locks, so it additionally takes this
    // same task projection lock while it reads/captures source state.
    let sourceLock = null;
    try {
    sourceLock = input.stage === "make-decision" ? this.#taskProjectionLock(input.task_id, "prepare-source") : null;
    // Recover before capability discovery or any continuation/runtime gate.
    // A pending public projection is host state, never a reason to call a provider.
    this.#recoverProjections(input.task_id);
    for (const field of ["previous_findings", "delta_manifest", "affected_materials", "current_material_manifest", "required_skill_lens_hashes"]) if (input[field] !== undefined) throw new Error(`${field} is derived by wh-review and caller values are rejected`);
    if (input.continuation_prompt_max_bytes !== undefined || input.continuationPromptMaxBytes !== undefined) throw new Error("caller continuation prompt limit is rejected; the host owns this limit");
    let initialHostSource = null;
    if (input.continuation !== true) {
      const sourceContext = this.#readSourceContext(input.task_id);
      initialHostSource = buildHostWorktreeSource(this.sourceRoot, { baseTree: sourceContext?.last_approved_tree ?? headTree(this.sourceRoot), excludePaths: internalLedgerExclusion(this.sourceRoot, this.taskTrackingRoot, input.task_id) });
      this.#recordInitialTree(input.task_id, initialHostSource.source_revision.base_tree);
    }
    if (!this.broker.discoverCapabilities) throw new Error("broker capability discovery is required");
    const capabilitySnapshot = await this.broker.discoverCapabilities();
    const capabilitySnapshotHash = sha(canonical(capabilitySnapshot));
    const reviewTrack = input.review_track ?? null;
    const resolution = this.requiredSkillResolver({ stage: input.stage, reviewTrack, ui: Boolean(input.ui) });
    const doctorCandidates = capabilitySnapshot.providers.filter((item) => item.status === "ready" && item.provider !== input.host_provider && item.capabilities.attachment_delivery.includes(resolution.deliveryMode)).map((item) => item.provider).sort();
    let prior = this.#readFlow(input); const continuation = input.continuation === true; let closureBundleGates = [];
    if (prior) prior = this.#recoverPendingReceiptBinding(input, prior);
    if (continuation && capabilitySnapshotHash !== prior?.capability_snapshot_hash) throw new Error("blocked_by_human_confirmation: broker capability snapshot changed; use reset with human approval");
    if (continuation && (!prior?.initial_runtime_id || !prior.continuation_eligible)) throw new Error("blocked_by_human_confirmation: flow cannot continue; use reset with human approval");
    if (continuation && (!/^[a-f0-9]{40,64}$/.test(prior?.last_reviewed_tree ?? "") || typeof prior?.review_tree_ref !== "string" || readReviewTreeRef(this.sourceRoot, prior.review_tree_ref) !== prior.last_reviewed_tree)) throw new Error("blocked_by_human_confirmation: last reviewed tree is unavailable; use reset with human approval");
    if (continuation && (!prior?.initial_delivery_by_provider || typeof prior.initial_delivery_by_provider !== "object" || !/^[a-f0-9]{64}$/.test(prior.initial_material_manifest_hash ?? "") || !/^[a-f0-9]{64}$/.test(prior.last_delivery_manifest_hash ?? ""))) throw new Error("blocked_by_human_confirmation: verified initial provider delivery is missing; use reset with human approval");
    if (!continuation && prior?.initial_runtime_id) throw new Error("blocked_by_human_confirmation: an initial runtime already exists; use reset with human approval");
    const candidateProviders = continuation ? [...(prior.continuable_providers ?? [])].sort() : doctorCandidates;
    const continuableProviders = continuation ? [...(prior.continuable_providers ?? [])].sort() : [];
    const packet = structuredClone(input.packet);
    if (packet?.stage !== input.stage || packet?.review_track !== reviewTrack) return this.#materialIncomplete(input, "packet stage or review_track does not match review intent");
    const stageContract = projectStageContract(input.stage, reviewTrack);
    const { contractHash } = stageContract;
    if (packet.contract_hash !== contractHash) {
      if (continuation) throw new Error("blocked_by_human_confirmation: frozen contract changed; use reset with human approval");
      return this.#materialIncomplete(input, "contract hash mismatch");
    }
    const actualBundleHash = resolution.skillBundleHash ?? bundleHash(resolution);
    if (packet.skill_bundle_hash !== actualBundleHash) {
      if (continuation) throw new Error("blocked_by_human_confirmation: frozen skill bundle changed; use reset with human approval");
      return this.#materialIncomplete(input, "skill bundle hash mismatch");
    }
    let priorPacket = null; let priorReceipt = null; let delta = null;
    if (continuation) {
      if (!prior.baseline_packet_hash || !prior.baseline_packet_ref || !prior.baseline_packet_file_sha256 || !prior.previous_packet_ref || !prior.previous_packet_file_sha256 || !prior.previous_receipt_ref || !prior.previous_receipt_sha256) throw new Error("blocked_by_human_confirmation: frozen baseline packet or previous private receipt is missing; use reset with human approval");
      const privateRoot = resolve(join(taskRoot(this.taskTrackingRoot, input.task_id), "reviews", "private"));
      const readFrozen = (path, expectedHash, label) => {
        const target = resolve(path);
        if (!target.startsWith(`${privateRoot}/`) || !existsSync(target)) throw new Error(`blocked_by_human_confirmation: frozen ${label} is unavailable; use reset with human approval`);
        const bytes = readFileSync(target);
        if (sha(bytes) !== expectedHash) throw new Error(`blocked_by_human_confirmation: frozen ${label} hash changed; use reset with human approval`);
        try { return JSON.parse(bytes); } catch { throw new Error(`blocked_by_human_confirmation: frozen ${label} is invalid; use reset with human approval`); }
      };
      const baselinePacket = readFrozen(prior.baseline_packet_ref, prior.baseline_packet_file_sha256, "baseline packet");
      priorPacket = readFrozen(prior.previous_packet_ref, prior.previous_packet_file_sha256, "previous packet");
      priorReceipt = readFrozen(prior.previous_receipt_ref, prior.previous_receipt_sha256, "previous private receipt");
      const priorBaselineBinding = priorPacket.round_kind === "initial" ? priorPacket.packet_hash : priorPacket.baseline_packet_hash;
      if (baselinePacket.packet_hash !== prior.baseline_packet_hash || priorBaselineBinding !== prior.baseline_packet_hash || priorPacket.packet_hash !== prior.packet_hash) throw new Error("blocked_by_human_confirmation: baseline packet binding is inconsistent; use reset with human approval");
      if (packet.round_kind !== undefined && packet.round_kind !== "continuation") throw new Error("blocked_by_human_confirmation: caller round_kind conflicts with continuation flow");
      if (packet.baseline_packet_hash !== undefined && packet.baseline_packet_hash !== prior.baseline_packet_hash) throw new Error("blocked_by_human_confirmation: caller baseline_packet_hash conflicts with frozen baseline");
      Object.assign(packet, buildHostWorktreeSource(this.sourceRoot, { baseTree: prior.last_reviewed_tree, excludePaths: internalLedgerExclusion(this.sourceRoot, this.taskTrackingRoot, input.task_id) }));
      packet.round_kind = "continuation"; packet.baseline_packet_hash = prior.baseline_packet_hash;
    } else {
      if (input.closure_evidence !== undefined) return this.#materialIncomplete(input, "closure_evidence is continuation-only");
      if (packet.round_kind !== undefined && packet.round_kind !== "initial") return this.#materialIncomplete(input, "initial packet round_kind is invalid");
      if (packet.baseline_packet_hash !== undefined && packet.baseline_packet_hash !== null) return this.#materialIncomplete(input, "initial packet baseline_packet_hash must be null");
      Object.assign(packet, initialHostSource);
      packet.round_kind = "initial"; packet.baseline_packet_hash = null;
      delta = { cross_stage_carryovers: checkedCarryovers(input.cross_stage_carryovers, [], { taskTrackingRoot: this.taskTrackingRoot, taskId: input.task_id, stage: input.stage }) };
    }
    try { sealPacket(packet); }
    catch (error) { return this.#materialIncomplete(input, error.message); }
    const sourcePath = findAbsolutePathLiteral(packet);
    if (sourcePath) return this.#materialIncomplete(input, `raw provider material contains an absolute path at ${sourcePath.trail}`, "SOURCE_CONTAINS_ABSOLUTE_PATH");
    if (continuation && (prior.contract_hash !== packet.contract_hash || prior.skill_bundle_hash !== actualBundleHash || prior.frozen_bundle_hash !== actualBundleHash)) throw new Error("blocked_by_human_confirmation: frozen contract or skill bundle changed; use reset with human approval");
    let baselinePacketHash = continuation ? prior.baseline_packet_hash : packet.packet_hash;
    if (continuation) {
      const previousFindings = structuredClone(priorReceipt.merged_findings ?? []);
      const deltaSource = buildTreeMaterial(this.sourceRoot, { baseTree: prior.last_reviewed_tree, snapshotTree: packet.source_revision.snapshot_tree });
      const closureCheck = exactClosureEvidence(previousFindings, input.closure_evidence, deltaSource, stageContract.hardIds);
      const closureEvidence = closureCheck.items;
      closureBundleGates = closureCheck.unverifiedBlockingIds;
      // Carryover state is host-owned and cumulative. Callers may only add or
      // supersede an id; omitting an open item must never erase it from the
      // next provider packet.
      const crossStageCarryovers = mergeCrossStageCarryovers(
        priorReceipt.delta?.cross_stage_carryovers ?? [],
        checkedCarryovers(input.cross_stage_carryovers, previousFindings, { taskTrackingRoot: this.taskTrackingRoot, taskId: input.task_id, stage: input.stage }),
      );
      delta = buildContinuationDelta({ previousPacket: priorPacket, currentPacket: packet, deltaSource, previousFindings, closureEvidence, crossStageCarryovers, requiredSkills: resolution.definitions });
      const deltaPath = findAbsolutePathLiteral(delta);
      if (deltaPath) return this.#materialIncomplete(input, `raw continuation material contains an absolute path at ${deltaPath.trail}`, "SOURCE_CONTAINS_ABSOLUTE_PATH");
    }
      const intent = { task_id: input.task_id, stage: input.stage, review_track: input.review_track ?? null, review_flow_id: input.review_flow_id,
      host_provider: input.host_provider ?? null, limits: { continuation_prompt_max_bytes: this.continuationPromptMaxBytes, initial_prompt_max_bytes: this.initialPromptMaxBytes, max_disposition_attempts: this.maxDispositionAttempts },
      business_round: (prior?.business_round ?? 0) + 1, contract_hash: packet.contract_hash, material_manifest_hash: packet.manifest_hash, skill_bundle_hash: packet.skill_bundle_hash,
      round_kind: continuation ? "continuation" : "initial", baseline_packet_hash: baselinePacketHash,
      initial_runtime_id: continuation ? prior.initial_runtime_id : null, previous_core_receipt_hash: prior?.core_receipt_hash ?? null,
      previous_private_receipt_hash: continuation ? prior.previous_receipt_sha256 : null,
      capability_snapshot_hash: capabilitySnapshotHash, candidate_providers: candidateProviders, continuable_providers: continuableProviders,
      idempotency_key: sha(`${input.task_id}\0${input.stage}\0${reviewTrack ?? "default"}\0${input.review_flow_id}\0${packet.packet_hash}\0${prior?.initial_runtime_id ?? "initial"}`) };
      validateSchema("review-intent", intent);
      const dir = this.#root(intent);
      const protocolPath = join(repositoryRoot, "skills", "wh-review", "contracts", "provider-protocol.md");
      const outputSchemaPath = join(repositoryRoot, "skills", "wh-review", "schemas", "reviewer-output.schema.json");
      const snapshotDir = join(dir, "frozen-inputs"); const frozenAttachments = [];
      const freeze = (destination, bytes) => { const target = join(snapshotDir, ...destination.split("/")); atomic(target, bytes); frozenAttachments.push({ destination, path: target, sha256: sha(bytes), size: Buffer.byteLength(bytes) }); };
      if (!continuation) {
        freeze("contracts/provider-protocol.md", readFileSync(protocolPath));
        freeze(`contracts/${input.stage}.md`, stageContract.content);
        freeze("schemas/reviewer-output.schema.json", readFileSync(outputSchemaPath));
        for (const definition of resolution.definitions) for (const file of definition.bundle.files) freeze(`skills/${definition.name}/${file.path}`, file.content);
      }
      freeze("changes.diff", packet.unified_diff);
      if (continuation) freeze("continuation-delta.v1.json", safeJson(delta));
      const bundleId = `wh-review-${intent.idempotency_key}`;
      // Delivery metadata is hash-bound before prompt rendering. file_only
      // explicitly denies embedding; always_embed explicitly permits it.
      const attachmentEmbed = resolution.deliveryMode === "always_embed";
      const materialBindingFiles = attachmentRecords(frozenAttachments.map((item) => ({ ...item, embed: attachmentEmbed })));
      const materialManifestHash = canonicalMaterialManifestHash(bundleId, materialBindingFiles);
      // 3rd-review's triad contract binds packet.manifest_hash to all
      // provider-visible material except the packet and inner manifest
      // themselves. Keep the independently derived source binding alongside
      // it, then re-seal the complete provider packet.
      packet.manifest_hash = materialManifestHash;
      packet.packet_hash = packetHash(packet);
      validateSchema("review-packet", packet);
      intent.material_manifest_hash = materialManifestHash;
      if (!continuation) {
        baselinePacketHash = packet.packet_hash;
        intent.baseline_packet_hash = baselinePacketHash;
      }
      atomic(join(dir, "review-packet.json"), safeJson(packet));
      freeze("review-packet.v1.json", safeJson(packet));
      const outerFilesBeforeInner = attachmentRecords(frozenAttachments.map((item) => ({ ...item, embed: attachmentEmbed })));
      const providerManifest = { version: "review-attachment-manifest.v1", delivery_mode: resolution.deliveryMode, packet_hash: packet.packet_hash, manifest_hash: packet.manifest_hash, diff_sha256: packet.diff_sha256, attachments: outerFilesBeforeInner.map(({ target: destination, sha256, size }) => ({ destination, sha256, size })), delivery_manifest_hash: canonicalDeliveryManifestHash(bundleId, outerFilesBeforeInner, resolution.deliveryMode), ...(continuation ? { continuation: { initial_material_manifest_hash: prior.initial_material_manifest_hash, sequence: (prior.continuation_sequence ?? 0) + 1, previous_delivery_manifest_hash: prior.last_delivery_manifest_hash } } : {}) };
      providerManifest.inner_manifest_hash = canonicalInnerManifestHash(providerManifest);
      const providerManifestBytes = safeJson(providerManifest); const providerVisibleManifestHash = sha(providerManifestBytes);
      freeze("manifest.json", providerManifestBytes);
      const outerFiles = attachmentRecords(frozenAttachments.map((item) => ({ ...item, embed: attachmentEmbed })));
      const materialBytes = outerFiles.reduce((total, item) => total + item.size, 0);
      const attachmentIds = frozenAttachments.map(({ destination }) => destination);
      const prompt = continuation
        ? continuationPrompt(delta, { packet, intent, attachmentIds, providerVisibleManifestHash })
        : initialPrompt({ packet, intent, attachmentIds, providerVisibleManifestHash });
      atomic(join(dir, "manifest.json"), safeJson({ packet_hash: packet.packet_hash, baseline_packet_hash: baselinePacketHash, manifest_hash: packet.manifest_hash, diff_sha256: packet.diff_sha256, provider_visible_manifest_sha256: providerVisibleManifestHash, delivery_manifest_hash: providerManifest.delivery_manifest_hash, material_manifest_hash: materialManifestHash, material_total_bytes: materialBytes, attachments: outerFiles, delta_manifest: continuation ? delta.delta_manifest : null }));
      const expectedDelivery = { delivery_mode: resolution.deliveryMode, material_manifest_hash: materialManifestHash, material_total_bytes: materialBytes, provider_visible_attachment_manifest: outerFiles.map(({ target: destination, sha256, size }) => ({ destination, sha256, size })) };
      const prepared = { intent, packet, input, lock, dir, resolution, capability_snapshot: capabilitySnapshot, initial_delivery_by_provider: prior?.initial_delivery_by_provider ?? null, frozen_bundle_hash: actualBundleHash, sealed_packet_hash: packet.packet_hash, frozen_snapshot_dir: snapshotDir, frozen_attachments: frozenAttachments, provider_visible_manifest: providerManifest, provider_visible_manifest_sha256: providerVisibleManifestHash, delivery_manifest_hash: providerManifest.delivery_manifest_hash, material_manifest_hash: materialManifestHash, material_total_bytes: materialBytes, expected_delivery: expectedDelivery, stage_contract_rules: { allIds: stageContract.allIds, hardIds: stageContract.hardIds }, closure_bundle_gates: closureBundleGates, delta, initial_prompt: prompt };
      Object.defineProperty(prepared, "delivery_policy", { value: resolution.deliveryMode, enumerable: false, writable: false, configurable: false });
      return prepared;
    } catch (error) { this.#releaseLock(lock); throw error; }
    finally { if (sourceLock) this.#releaseLock(sourceLock); }
  }

  async run(prepared) {
    prepared = await prepared;
    const { intent, packet, input } = prepared;
    let attachmentPlan = null; let taskLock = null;
    try {
      if (intent.stage === "make-decision") taskLock = this.#taskProjectionLock(intent.task_id, `run-${intent.review_flow_id}`);
      if (packet.packet_hash !== prepared.sealed_packet_hash || packetHash(packet) !== prepared.sealed_packet_hash || packet.stage !== intent.stage || packet.review_track !== intent.review_track) throw new Error("MATERIAL_INCOMPLETE: sealed review packet was modified after prepare");
      if (intent.initial_runtime_id && this.broker.status) {
        const state = await this.broker.status({ runtime_id: intent.initial_runtime_id });
        if (!state || (typeof state.expires_at_ms === "number" && state.expires_at_ms <= this.now())) throw new Error("blocked_by_human_confirmation: initial runtime expired; use reset with human approval");
      }
      attachmentPlan = this.#attachments(prepared);
      const request = { version: 4, host_provider: input.host_provider, prompt: prepared.initial_prompt, continuation: intent.initial_runtime_id ? { runtime_id: intent.initial_runtime_id, ...prepared.provider_visible_manifest.continuation } : null, provider_allowlist: intent.candidate_providers, material_manifest_sha256: prepared.material_manifest_hash, attachment_ids: attachmentPlan.manifest.entries.map(({ destination, sha256 }) => ({ destination, sha256 })) };
      const attachments = attachmentPlan?.manifest;
      const response = intent.candidate_providers.length === 0
        ? { providers: [], transport_error: { code: "NO_CAPABLE_PROVIDER", message: "doctor reported no ready heterologous provider with a supported attachment delivery" } }
        : await this.broker.run({ request, attachments, attachmentDelivery: prepared.delivery_policy, privateRawDirectory: join(prepared.dir, "provider-raw") });
      atomic(join(prepared.dir, "broker-run.json"), safeJson(response));
      const candidateSet = new Set(intent.candidate_providers);
      const capabilityByProvider = new Map(prepared.capability_snapshot.providers.map((item) => [item.provider, item.capabilities]));
      const outcomes = (response.providers ?? []).map((item) => candidateSet.has(item?.provider)
        ? this.#outcome(item, packet, intent, input, prepared.dir, capabilityByProvider.get(item.provider), prepared.initial_delivery_by_provider?.[item.provider], prepared.expected_delivery, prepared.stage_contract_rules)
        : { provider: null, transport_status: "failed", packet_status: "material_incomplete", semantic_verdict: null, business_valid: false, diagnostic: "UNKNOWN_PROVIDER" });
      const returnedCandidates = new Set((response.providers ?? []).map((item) => item?.provider).filter((provider) => candidateSet.has(provider)));
      for (const provider of intent.candidate_providers) if (!returnedCandidates.has(provider)) outcomes.push({ provider, transport_status: "failed", packet_status: "material_incomplete", semantic_verdict: null, business_valid: false, delivery_used: null, diagnostic: "PROVIDER_OUTCOME_MISSING" });
      if (response.transport_error) outcomes.push({ provider: null, transport_status: "failed", packet_status: "material_incomplete", semantic_verdict: null, business_valid: false, diagnostic: response.transport_error.code });
      const continuable_providers = outcomes.filter((item) => capabilityByProvider.get(item.provider)?.continuation === true && item.transport_status === "completed" && item.packet_status === "complete" && item.business_valid && typeof item.session_id === "string" && item.session_id.length > 0).map((item) => item.provider).sort();
      const eligible = continuable_providers.length > 0;
      const outcomeIntent = { ...intent, continuable_providers };
      const aggregate = outcomes.filter((item) => item.transport_status === "completed" && item.packet_status === "complete" && item.business_valid && item.semantic_verdict);
      const severityRank = { minor: 1, important: 2, blocking: 3 };
      const unique = new Map();
      for (const item of aggregate) for (const finding of item.findings) {
        const existing = unique.get(finding.finding_id);
        const providerEvidence = { provider: item.provider, evidence: finding.evidence, suggested_fix: finding.suggested_fix, severity: finding.severity };
        if (!existing) unique.set(finding.finding_id, { ...finding, providers: [item.provider], evidence_by_provider: [providerEvidence] });
        else {
          existing.providers = [...new Set([...existing.providers, item.provider])].sort();
          existing.evidence_by_provider.push(providerEvidence);
          if (severityRank[finding.severity] > severityRank[existing.severity]) existing.severity = finding.severity;
        }
      }
      const raw_merged_findings = [...unique.values()];
      // Continuation rounds reconcile the previous receipt before exposing a
      // merged result. A new blocking finding is retained only when its file
      // is present in the host-verified delta; otherwise the state machine
      // marks it late and caps it at minor.
      const previousFindings = prepared.delta?.previous_findings ?? [];
      const addedLines = addedDeltaLineKeys(prepared.delta?.affected_materials?.changes_diff);
      const provenNewBlockingIds = new Set(raw_merged_findings.filter((item) => intent.round_kind === "initial"
        || (!previousFindings.some((old) => old.finding_id === item.finding_id) && addedLines.has(`${item.file}\0${item.line}`))).map((item) => item.finding_id));
      const closureBundleGateIds = new Set((prepared.closure_bundle_gates ?? []).map((item) => item.finding_id));
      const findingState = reconcileFindingState({ previousFindings, currentFindings: raw_merged_findings, closureEvidence: prepared.delta?.closure_evidence ?? [], unverifiedClosureFindingIds: closureBundleGateIds, businessRound: intent.business_round, introducedBlockingIds: provenNewBlockingIds, previouslyImpossibleIds: provenNewBlockingIds, contractHardIds: prepared.stage_contract_rules.hardIds });
      const merged_findings = findingState.findings;
      const contractHardIds = new Set(prepared.stage_contract_rules.hardIds);
      const hard_gates = merged_findings.filter((finding) => finding.status !== "closed" && isBlocking(finding, contractHardIds));
      // An escalation is a business-valid result, not an empty pass. Keep its
      // provider provenance independent from findings so a finding-free
      // escalation cannot disappear during merge or publication.
      const human_gates = [...deriveHumanGates(outcomes)];
      for (const item of prepared.closure_bundle_gates ?? []) human_gates.push({ provider: null, verdict: "escalate_to_human", finding_id: item.finding_id, summary: `blocking closure bundle is insufficient: ${item.reason}` });
      if (findingState.escalate_to_human) human_gates.push({ provider: null, verdict: "escalate_to_human", summary: "blocking finding remained open for three rounds" });
      const blockedByHumanConfirmation = outcomes.some((item) => item.requires_human_confirmation === true) || findingState.escalate_to_human || (prepared.closure_bundle_gates?.length ?? 0) > 0;
      const initialDeliveryByProvider = prepared.initial_delivery_by_provider ?? Object.fromEntries(intent.candidate_providers.map((provider) => [provider, outcomes.find((item) => item.provider === provider)?.delivery ?? null]));
      // Any durable private review state has a public fail-closed companion.
      // Until dispositions complete its projection, CI must not trust an older pass.
      const pending = this.#ensureProjectionGuard(outcomeIntent);
      const delivery = { delivery_mode: prepared.delivery_policy, material_manifest_sha256: prepared.material_manifest_hash, delivery_manifest_hash: prepared.delivery_manifest_hash, material_total_bytes: prepared.material_total_bytes, provider_visible_attachment_manifest: prepared.expected_delivery.provider_visible_attachment_manifest };
      const receipt = { version: 1, intent: outcomeIntent, delta: prepared.delta, runtime_id: response.runtime_id ?? intent.initial_runtime_id, delivery_policy: prepared.delivery_policy, delivery, initial_delivery_by_provider: initialDeliveryByProvider, capability_snapshot: prepared.capability_snapshot, capability_snapshot_hash: intent.capability_snapshot_hash, candidate_providers: intent.candidate_providers, provider_outcomes: outcomes, merged_findings, hard_gates, human_gates, blocked_by_human_confirmation: blockedByHumanConfirmation, continuable_providers, continuation_eligible: eligible, projection_pending: pending, created_at_ms: this.now() };
      const receiptPath = join(prepared.dir, "round-receipt.json"); atomic(receiptPath, safeJson(receipt));
      const result = { intent: outcomeIntent, round_kind: intent.round_kind, baseline_packet_hash: intent.baseline_packet_hash,
        previous_findings: prepared.delta?.previous_findings ?? [], closure_evidence: prepared.delta?.closure_evidence ?? [], delta_manifest: prepared.delta?.delta_manifest ?? null,
        affected_materials: prepared.delta?.affected_materials ?? {}, current_material_manifest: prepared.delta?.current_material_manifest ?? {},
        cross_stage_carryovers: prepared.delta?.cross_stage_carryovers ?? [], required_skill_lens_hashes: prepared.delta?.required_skill_lens_hashes ?? [],
        provider_outcomes: outcomes, merged_findings, hard_gates, human_gates, blocked_by_human_confirmation: blockedByHumanConfirmation, continuation_eligible: eligible, receipt_draft_ref: receiptPath };
      const priorFlow = this.#readFlow(intent);
      const packetRef = join(prepared.dir, "review-packet.json"); const packetFileHash = sha(readFileSync(packetRef));
      const reviewedTree = packet.source_revision.snapshot_tree;
      const reviewTreeRef = priorFlow?.review_tree_ref ?? this.#treeRef(intent);
      const oldReviewTree = typeof priorFlow?.review_tree_ref === "string" ? readReviewTreeRef(this.sourceRoot, priorFlow.review_tree_ref) : null;
      if (aggregate.length) updateReviewTreeRef(this.sourceRoot, reviewTreeRef, reviewedTree);
      const verifiedInitialMaterial = !intent.initial_runtime_id ? [...new Set(outcomes.filter((item) => item.business_valid).map((item) => item.delivery?.material_manifest_hash).filter(Boolean))] : [priorFlow?.initial_material_manifest_hash];
      if (aggregate.length && (verifiedInitialMaterial.length !== 1 || !/^[a-f0-9]{64}$/.test(verifiedInitialMaterial[0] ?? ""))) throw new Error("MATERIAL_INCOMPLETE: verified provider delivery cannot establish one initial material hash");
      try { this.#writeFlow(intent, { ...(priorFlow ?? {}), ...outcomeIntent, initial_runtime_id: intent.initial_runtime_id ?? response.runtime_id ?? null, delivery_policy: prepared.delivery_policy, initial_delivery_by_provider: initialDeliveryByProvider, initial_material_manifest_hash: priorFlow?.initial_material_manifest_hash ?? verifiedInitialMaterial[0] ?? null, last_delivery_manifest_hash: aggregate.length ? prepared.delivery_manifest_hash : priorFlow?.last_delivery_manifest_hash ?? null, continuation_sequence: aggregate.length ? (prepared.provider_visible_manifest.continuation?.sequence ?? priorFlow?.continuation_sequence ?? 0) : priorFlow?.continuation_sequence ?? 0, capability_snapshot_hash: intent.capability_snapshot_hash, candidate_providers: intent.candidate_providers, continuable_providers, continuation_eligible: eligible, business_round: aggregate.length ? intent.business_round : (priorFlow?.business_round ?? 0), packet_hash: packet.packet_hash, frozen_bundle_hash: prepared.frozen_bundle_hash,
        baseline_packet_ref: priorFlow?.baseline_packet_ref ?? packetRef, baseline_packet_file_sha256: priorFlow?.baseline_packet_file_sha256 ?? packetFileHash,
        previous_packet_ref: packetRef, previous_packet_file_sha256: packetFileHash, previous_receipt_ref: receiptPath, previous_receipt_sha256: sha(readFileSync(receiptPath)),
        projection_pending: pending, ...(aggregate.length ? { last_reviewed_tree: reviewedTree, review_tree_ref: reviewTreeRef } : {}) }); }
      catch (error) {
        if (aggregate.length) {
          if (oldReviewTree) updateReviewTreeRef(this.sourceRoot, reviewTreeRef, oldReviewTree);
          else deleteReviewTreeRef(this.sourceRoot, reviewTreeRef);
        }
        throw error;
      }
      // A provider-originated escalation is already a semantic result. Publish
      // its redacted gate projection in this same run, instead of waiting for
      // a later prepare() recovery pass to revoke a stale public pass.
      if (human_gates.length) {
        // run() already holds the task-wide projection lock: ordinary stages
        // use their flow lock, and make-decision uses taskLock above. Taking
        // it again is non-reentrant and turns every human gate into a false
        // "review-already-running" failure.
        this.#writeHumanGateBlock(receipt, receiptPath, join(prepared.dir, "projection-manifest.json"), human_gates);
      }
      return validateSchema("round-run-result", result);
    } finally { if (taskLock) this.#releaseLock(taskLock); this.#releaseLock(prepared.lock); if (attachmentPlan?.stagingDir) rmSync(attachmentPlan.stagingDir, { recursive: true, force: true }); }
  }

  #acquireLock(intent) {
    const lock = this.#lock(intent); mkdirSync(dirname(lock), { recursive: true, mode: 0o700 });
    let acquired = false;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try { mkdirSync(lock, { mode: 0o700 }); acquired = true; break; }
      catch (error) {
        if (error?.code !== "EEXIST") throw error;
        const ownerPath = join(lock, "owner.json"); let owner;
        try { owner = JSON.parse(readFileSync(ownerPath, "utf8")); }
        catch (cause) { if (cause?.code === "ENOENT") continue; throw new Error("review-already-running: lock metadata is unreadable"); }
        if (!Number.isInteger(owner?.pid) || owner.pid <= 0 || !Number.isFinite(owner?.created_at_ms) || typeof owner?.idempotency_key !== "string") throw new Error("review-already-running: lock metadata is invalid");
        let active = true;
        try {
          process.kill(owner.pid, 0);
          // A live PID alone is not sufficient: it can have been reused after
          // the original owner died. New locks persist the process start
          // identity; historical locks use the conservative elapsed fallback.
          const currentStart = processStartIdentity(owner.pid);
          if (typeof owner.process_start_identity === "string" && owner.process_start_identity) active = currentStart === owner.process_start_identity;
          else {
            const elapsedSeconds = Number(String(execFileSync("ps", ["-o", "etimes=", "-p", String(owner.pid)], { encoding: "utf8" })).trim());
            if (Number.isFinite(elapsedSeconds) && elapsedSeconds * 1000 + 2000 < this.now() - owner.created_at_ms) active = false;
          }
        } catch (cause) { active = cause?.code !== "ESRCH"; }
        if (active) throw new Error("review-already-running");
        // Never rm the shared lock path. Atomically rename it into a private
        // claim; only the winner may remove that claimed stale directory.
        const claim = `${lock}.stale.${process.pid}.${randomUUID()}`;
        try { renameSync(lock, claim); }
        catch (cause) { if (cause?.code === "ENOENT" || cause?.code === "EEXIST") continue; throw cause; }
        rmSync(claim, { recursive: true, force: true });
      }
    }
    if (!acquired) throw new Error("review-already-running: lock recovery raced repeatedly");
    atomic(join(lock, "owner.json"), safeJson({ pid: process.pid, process_start_identity: processStartIdentity(process.pid), created_at_ms: this.now(), idempotency_key: intent.idempotency_key }));
    return lock;
  }
  #releaseLock(lock) { rmSync(lock, { recursive: true, force: true }); }
  #recoverPendingReceiptBinding(intent, flow) {
    const pending = flow.pending_receipt_update; if (!pending) return flow;
    const receiptPath = resolve(flow.previous_receipt_ref ?? "");
    const expectedJournal = join(dirname(receiptPath), "receipt-update-journal.json");
    const journalPath = resolve(pending.journal_ref ?? "");
    const privateRoot = resolve(join(taskRoot(this.taskTrackingRoot, intent.task_id), "reviews", "private"));
    if (!receiptPath.startsWith(`${privateRoot}/`) || journalPath !== expectedJournal || !existsSync(journalPath)) throw new Error("blocked_by_human_confirmation: pending receipt journal binding is invalid");
    const journalBytes = readFileSync(journalPath);
    if (sha(journalBytes) !== pending.journal_sha256) throw new Error("blocked_by_human_confirmation: pending receipt journal hash mismatch");
    let journal; try { journal = JSON.parse(journalBytes); } catch { throw new Error("blocked_by_human_confirmation: pending receipt journal is invalid"); }
    const expected = journal?.version === 1 && journal.task_id === intent.task_id && journal.stage === intent.stage && journal.review_flow_id === intent.review_flow_id
      && resolve(journal.receipt_ref ?? "") === receiptPath && journal.old_receipt_sha256 === flow.previous_receipt_sha256
      && journal.old_receipt_sha256 === pending.old_receipt_sha256 && journal.new_receipt_sha256 === pending.new_receipt_sha256
      && sha(safeJson(journal.receipt)) === journal.new_receipt_sha256;
    if (!expected) throw new Error("blocked_by_human_confirmation: pending receipt journal provenance mismatch");
    const currentHash = sha(readFileSync(receiptPath));
    if (currentHash === journal.old_receipt_sha256) atomic(receiptPath, safeJson(journal.receipt));
    else if (currentHash !== journal.new_receipt_sha256) throw new Error("blocked_by_human_confirmation: receipt changed outside pending journal");
    if (sha(readFileSync(receiptPath)) !== journal.new_receipt_sha256) throw new Error("blocked_by_human_confirmation: recovered receipt hash mismatch");
    const { pending_receipt_update, ...rest } = flow;
    const healed = { ...rest, previous_receipt_sha256: journal.new_receipt_sha256 };
    this.#writeFlow(intent, healed); rmSync(journalPath, { force: true }); return healed;
  }
  #updateReceiptAndFlow(intent, receiptPath, receipt) {
    const flow = this.#readFlow(intent);
    if (!flow || resolve(flow.previous_receipt_ref ?? "") !== resolve(receiptPath)) throw new Error("receipt update is not bound to the current flow");
    const oldHash = sha(readFileSync(receiptPath));
    if (flow.previous_receipt_sha256 !== oldHash) throw new Error("receipt update old hash does not match current flow");
    const newHash = sha(safeJson(receipt)); const journalPath = join(dirname(receiptPath), "receipt-update-journal.json");
    const journal = { version: 1, task_id: intent.task_id, stage: intent.stage, review_flow_id: intent.review_flow_id, receipt_ref: resolve(receiptPath), old_receipt_sha256: oldHash, new_receipt_sha256: newHash, receipt };
    atomic(journalPath, safeJson(journal));
    this.#writeFlow(intent, { ...flow, pending_receipt_update: { journal_ref: journalPath, journal_sha256: sha(readFileSync(journalPath)), old_receipt_sha256: oldHash, new_receipt_sha256: newHash } });
    this.faultInjector("after-publish-journal-bind");
    atomic(receiptPath, safeJson(receipt)); this.faultInjector("after-publish-receipt-write");
    return this.#recoverPendingReceiptBinding(intent, this.#readFlow(intent));
  }
  #recoverProjections(taskId, acquireSharedTaskLock = false) {
    if (!acquireSharedTaskLock) return this.#recoverProjectionsUnderTaskLock(taskId);
    const lock = this.#taskProjectionLock(taskId, "recover-projections");
    try { return this.#recoverProjectionsUnderTaskLock(taskId); }
    finally { this.#releaseLock(lock); }
  }
  recover({ task_id }) {
    assertSafeTaskId(task_id);
    return { recovered: this.#recoverProjections(task_id, true) };
  }
  #recoverProjectionsUnderTaskLock(taskId) {
    const reviews = join(taskRoot(this.taskTrackingRoot, taskId), "reviews");
    const privateRoot = join(reviews, "private");
    const guards = existsSync(reviews) ? readdirSync(reviews).filter((name) => /^projection-pending-.*\.json$/.test(name)).map((name) => join(reviews, name)) : [];
    if (!existsSync(privateRoot)) {
      let recovered = 0;
      for (const guardPath of guards) {
        const intent = this.#readOrphanProjectionGuard(guardPath, taskId);
        if (this.#hasPublicProjection(intent)) throw new Error("PROJECTION_RECOVERY_RECEIPT_MISSING: projection guard has public artifacts but no private receipt");
        rmSync(guardPath, { force: true }); recovered += 1;
      }
      return recovered;
    }
    let recovered = 0; const boundGuards = new Set();
    for (const name of readdirSync(privateRoot)) {
      if (!name.startsWith("round-")) continue; const dir = join(privateRoot, name), projection = join(dir, "projection-manifest.json"), receipt = join(dir, "round-receipt.json");
      if (!existsSync(receipt)) continue;
      let saved;
      try { saved = JSON.parse(readFileSync(receipt, "utf8")); }
      catch { throw new Error("PROJECTION_RECOVERY_RECEIPT_INVALID: private receipt is invalid JSON"); }
      if (saved?.intent?.task_id !== taskId) throw new Error("PROJECTION_RECOVERY_RECEIPT_TASK_MISMATCH: private receipt belongs to another task");
      try { assertSafeTaskId(saved.intent.task_id); assertKnownStage(saved.intent.stage); assertReviewTrack(saved.intent.stage, saved.intent.review_track ?? null); assertSafeReviewFlowId(saved.intent.review_flow_id); }
      catch { throw new Error("PROJECTION_RECOVERY_RECEIPT_INVALID: private receipt intent is invalid"); }
      if (resolve(dir) !== resolve(this.#root(saved.intent))) throw new Error("PROJECTION_RECOVERY_RECEIPT_INVALID: private receipt directory does not bind its intent");
      const guardPath = this.#projectionGuardPath(saved.intent);
      // A receipt-write crash leaves the new receipt bytes and the old flow
      // hash behind. Heal (or reject a tampered journal) before any attempt
      // to replay the projection; otherwise replay tries a second receipt
      // update and reports an unrelated old-hash mismatch.
      let flow = this.#readFlow(saved.intent);
      if (flow?.pending_receipt_update) flow = this.#recoverPendingReceiptBinding(saved.intent, flow);
      if (existsSync(guardPath)) { boundGuards.add(guardPath); this.#readVerifiedProjectionGuard(saved.intent); }
      if (saved.projection_pending !== undefined || flow?.projection_pending !== undefined) {
        if (!existsSync(guardPath)) throw new Error("PROJECTION_RECOVERY_GUARD_MISSING: private projection state has no public guard");
        const pending = this.#projectionPending(saved.intent);
        if (canonical(saved.projection_pending ?? flow.projection_pending) !== canonical(pending)) throw new Error("PROJECTION_RECOVERY_GUARD_INVALID: private projection metadata does not bind the public guard");
      }
      const provider_human_gates = deriveHumanGates(saved.provider_outcomes);
      const state_human_gates = (saved.human_gates ?? []).filter((gate) => gate?.provider === null && gate?.verdict === "escalate_to_human");
      const human_gates = [...provider_human_gates, ...state_human_gates];
      if (human_gates.length) {
        if (this.#isResolvedByReset(saved, receipt, human_gates)) continue;
        this.#writeHumanGateBlock(saved, receipt, projection, human_gates);
        if (saved.human_gates !== undefined && canonical(saved.human_gates) !== canonical(human_gates)) throw new Error("human gate provenance does not match provider outcomes or finding state");
        throw new Error("human gate requires explicit human confirmation before publication");
      }
      verifiedHumanGates(saved.provider_outcomes, saved.human_gates);
      const flags = existsSync(projection) ? (JSON.parse(readFileSync(projection, "utf8")).done_flags ?? {}) : {};
      if (flags.core_receipt && flags.report && flags.report_index && flags.stage_result) {
        if (saved.intent.stage === "make-decision") {
          if (existsSync(guardPath)) {
            const aggregate = this.#publishMakeDecisionAggregate(saved.intent.task_id, saved.intent.review_flow_id);
            if (!aggregate) throw new Error("PROJECTION_RECOVERY_AGGREGATE_MISSING: complete make-decision tracks have no aggregate authority");
            recovered += 1;
          }
        } else if (existsSync(guardPath)) this.#completeProjection(saved.intent, receipt);
        continue;
      }
      if (!Array.isArray(saved.dispositions)) continue;
      this.#publishUnderLock({ intent: saved.intent, provider_outcomes: saved.provider_outcomes, merged_findings: saved.merged_findings, hard_gates: saved.hard_gates, human_gates: saved.human_gates, blocked_by_human_confirmation: saved.blocked_by_human_confirmation, receipt_draft_ref: receipt }, { items: saved.dispositions });
      recovered += 1;
    }
    for (const guardPath of guards.filter((path) => !boundGuards.has(path) && existsSync(path))) {
      const intent = this.#readOrphanProjectionGuard(guardPath, taskId);
      if (this.#hasPublicProjection(intent)) throw new Error("PROJECTION_RECOVERY_RECEIPT_MISSING: projection guard has public artifacts but no bound private receipt");
      rmSync(guardPath, { force: true }); recovered += 1;
    }
    return recovered;
  }
  #writeHumanGateBlock(saved, receiptPath, projectionPath, human_gates) {
    // Receipt and flow are a single recovery unit. Never overwrite the
    // receipt directly here: a crash between receipt bytes and flow hash used
    // to leave an unrecoverable human gate.
    const flow = this.#readFlow(saved.intent);
    if (flow?.pending_receipt_update) this.#recoverPendingReceiptBinding(saved.intent, flow);
    const pending = this.#ensureProjectionGuard(saved.intent);
    const receipt = { ...saved, human_gates, projection_pending: pending };
    this.#updateReceiptAndFlow(saved.intent, receiptPath, receipt);
    const pendingFlow = this.#readFlow(saved.intent);
    if (!pendingFlow) throw new Error("PROJECTION_RECOVERY_FLOW_MISSING: human gate has no flow");
    this.#writeFlow(saved.intent, { ...pendingFlow, projection_pending: pending });
    const dir = dirname(receiptPath); const { reportPath, indexPath, stageResultPath } = this.#publicPaths(saved.intent);
    const semantic_verdict = "escalate_to_human", needs_human = true;
    const core = projectPublicReviewCore({ version: 1, intent: saved.intent, semantic_verdict, needs_human, merged_findings: saved.merged_findings ?? [], hard_gates: saved.hard_gates ?? [], human_gates, provider_outcomes: saved.provider_outcomes ?? [] }, { sensitiveSource: saved });
    const corePath = join(dir, "core-receipt.json"); atomic(corePath, safeJson(core)); const coreHash = sha(readFileSync(corePath));
    const publicCorePath = this.#publicCorePath(saved.intent, coreHash); this.faultInjector("before-public-core-write"); atomic(publicCorePath, readFileSync(corePath), 0o644);
    this.faultInjector("before-public-report-write"); atomic(reportPath, `# 审查报告\n\n结论：需要人工确认\n\n- Human gates：${core.human_gates.map(({ provider }) => provider).join(", ")}\n`, 0o644);
    this.faultInjector("before-public-index-write"); atomic(indexPath, safeJson({ stage: saved.intent.stage, core_receipt_hash: coreHash, semantic_verdict, needs_human, report: relative(dirname(indexPath), reportPath), verdict: semantic_verdict, blocked_by_human_gate: true }), 0o644);
    this.faultInjector("before-public-stage-result"); atomic(stageResultPath, safeJson({ stage: saved.intent.stage, core_receipt_hash: coreHash, semantic_verdict, verdict: semantic_verdict, needs_human, blocked_by_human_gate: true, human_gate_providers: human_gates.map(({ provider }) => provider) }), 0o644);
    const publishedFlow = this.#readFlow(saved.intent);
    if (publishedFlow) this.#writeFlow(saved.intent, { ...publishedFlow, core_receipt_hash: coreHash, previous_receipt_sha256: sha(readFileSync(receiptPath)), published_at_ms: this.now() });
    if (saved.intent.stage === "make-decision") this.#publishMakeDecisionAggregate(saved.intent.task_id, saved.intent.review_flow_id);
    const projection = existsSync(projectionPath) ? JSON.parse(readFileSync(projectionPath, "utf8")) : { version: 1, done_flags: {} };
    projection.done_flags = { ...(projection.done_flags ?? {}), core_receipt: true, public_core_receipt: true, report: true, report_index: true, stage_result: true, human_gate_blocked: true };
    atomic(projectionPath, safeJson(projection));
    this.#completeProjection(saved.intent, receiptPath);
  }
  #isResolvedByReset(saved, receiptPath, human_gates) {
    const markerPath = join(dirname(receiptPath), "resolved-by-reset.json"); if (!existsSync(markerPath)) return false;
    const marker = JSON.parse(readFileSync(markerPath, "utf8"));
    if (!(marker?.version === 1 && marker.status === "superseded" && marker.task_id === saved.intent?.task_id && marker.stage === saved.intent?.stage && (marker.review_track ?? null) === (saved.intent?.review_track ?? null) && marker.old_review_flow_id === saved.intent?.review_flow_id && typeof marker.new_review_flow_id === "string" && marker.new_review_flow_id.length > 0 && typeof marker.human_approval_ref === "string" && marker.human_approval_ref.length > 0 && marker.receipt_sha256 === sha(readFileSync(receiptPath)) && canonical(marker.human_gates) === canonical(human_gates))) return false;
    const privateRoot = join(taskRoot(this.taskTrackingRoot, saved.intent.task_id), "reviews", "private");
    const approvalPath = this.#resetApproval({ task_id: saved.intent.task_id, stage: saved.intent.stage, review_track: saved.intent.review_track ?? null, review_flow_id: marker.new_review_flow_id });
    if (marker.reset_approval_ref !== relative(privateRoot, approvalPath) || !existsSync(approvalPath)) return false;
    const approvalBytes = readFileSync(approvalPath); if (marker.reset_approval_sha256 !== sha(approvalBytes)) return false;
    const approval = JSON.parse(approvalBytes);
    if (!(approval?.version === 1 && approval.task_id === saved.intent.task_id && approval.stage === saved.intent.stage && (approval.review_track ?? null) === (saved.intent.review_track ?? null) && approval.review_flow_id === marker.new_review_flow_id && approval.parent_review_flow_id === saved.intent.review_flow_id && approval.human_approval_ref === marker.human_approval_ref)) return false;
    const newFlowPath = this.#flow({ task_id: saved.intent.task_id, stage: saved.intent.stage, review_track: saved.intent.review_track ?? null, review_flow_id: marker.new_review_flow_id });
    if (!existsSync(newFlowPath)) return false;
    const newFlow = JSON.parse(readFileSync(newFlowPath));
    return newFlow?.task_id === saved.intent.task_id && newFlow.stage === saved.intent.stage && (newFlow.review_track ?? null) === (saved.intent.review_track ?? null) && newFlow.review_flow_id === marker.new_review_flow_id && newFlow.parent_review_flow_id === saved.intent.review_flow_id && newFlow.human_approval_ref === marker.human_approval_ref;
  }
  #markResetResolvedGates({ task_id, stage, review_track, review_flow_id, new_review_flow_id, reset_approval_ref, reset_approval_sha256, reason, human_approval_ref }) {
    const privateRoot = join(taskRoot(this.taskTrackingRoot, task_id), "reviews", "private"); if (!existsSync(privateRoot)) return [];
    const markers = [];
    for (const name of readdirSync(privateRoot)) {
      if (!name.startsWith("round-")) continue;
      const dir = join(privateRoot, name), receiptPath = join(dir, "round-receipt.json"); if (!existsSync(receiptPath)) continue;
      const receiptBytes = readFileSync(receiptPath); const receipt = JSON.parse(receiptBytes);
      if (receipt?.intent?.stage !== stage || (receipt.intent.review_track ?? null) !== review_track || receipt.intent.review_flow_id !== review_flow_id) continue;
      const human_gates = deriveHumanGates(receipt.provider_outcomes); if (!human_gates.length) continue;
      const marker = { version: 1, status: "superseded", task_id, stage, review_track, old_review_flow_id: review_flow_id, new_review_flow_id, reset_approval_ref, reset_approval_sha256, human_approval_ref, reason, receipt_sha256: sha(receiptBytes), human_gates };
      const markerPath = join(dir, "resolved-by-reset.json"); writeImmutable(markerPath, marker); markers.push(markerPath);
    }
    return markers;
  }
  #materialIncomplete(input, message, code = "MATERIAL_INCOMPLETE") {
    const root = join(taskRoot(this.taskTrackingRoot, input.task_id), "reviews", "private", "diagnostics");
    atomic(join(root, `material-incomplete-${this.now()}.json`), safeJson({ code, message, stage: input.stage, review_track: input.review_track ?? null, review_flow_id: input.review_flow_id }));
    throw new Error(`${code}: ${message}`);
  }
  #attachments(prepared) {
    if (prepared.input.attachments) throw new Error("MATERIAL_INCOMPLETE: custom attachments cannot replace the sealed review packet bundle");
    const manifestEntry = prepared.frozen_attachments.find((item) => item.destination === "manifest.json");
    if (!manifestEntry) throw new Error("MATERIAL_INCOMPLETE: provider-visible manifest is missing");
    let visible;
    try { visible = JSON.parse(readFileSync(manifestEntry.path, "utf8")); }
    catch { throw new Error("MATERIAL_INCOMPLETE: provider-visible manifest is invalid"); }
    const outerFiles = attachmentRecords(prepared.frozen_attachments.map((item) => ({ ...item, embed: prepared.delivery_policy === "always_embed" })));
    const covered = outerFiles.filter((item) => item.target !== "manifest.json").map(({ target: destination, sha256, size }) => ({ destination, sha256, size }));
    if (sha(readFileSync(manifestEntry.path)) !== prepared.provider_visible_manifest_sha256
      || visible?.version !== "review-attachment-manifest.v1" || visible.delivery_mode !== prepared.delivery_policy || visible.packet_hash !== prepared.packet.packet_hash
      || visible.manifest_hash !== prepared.packet.manifest_hash || visible.diff_sha256 !== prepared.packet.diff_sha256
      || canonical(visible.attachments) !== canonical(covered) || visible.delivery_manifest_hash !== prepared.delivery_manifest_hash
      || visible.inner_manifest_hash !== canonicalInnerManifestHash(visible)
      || (prepared.intent.round_kind === "continuation" && canonical(visible.continuation) !== canonical(prepared.provider_visible_manifest.continuation))) throw new Error("MATERIAL_INCOMPLETE: provider-visible manifest binding is invalid");
    const root = resolve(prepared.input.attachment_root ?? this.skillsRoot);
    const rel = (path) => {
      const value = relative(root, path).split("\\").join("/");
      if (!value || value === ".." || value.startsWith("../")) throw new Error("MATERIAL_INCOMPLETE: attachment root must contain packet, contracts, and repository skills");
      return value;
    };
    // Attachments are copied exclusively from prepare's private immutable
    // snapshot; source skills/contracts are never read again during run.
    const stagingDir = join(root, ".wh-review-packets", prepared.intent.idempotency_key); const entries = [];
    for (const frozen of prepared.frozen_attachments) {
      const target = join(stagingDir, ...frozen.destination.split("/")); const bytes = readFileSync(frozen.path);
      if (bytes.length !== frozen.size || sha(bytes) !== frozen.sha256) throw new Error("MATERIAL_INCOMPLETE: private frozen attachment changed");
      atomic(target, bytes); entries.push({ source: rel(target), destination: frozen.destination, size: frozen.size, sha256: frozen.sha256, embed: prepared.delivery_policy === "always_embed" });
    }
    return { stagingDir, manifest: { version: 1, bundle_id: `wh-review-${prepared.intent.idempotency_key}`, entries } };
  }
  #outcome(item, packet, intent, input, directory, capabilities, initialDelivery, expectedDelivery, contractRules) {
    const transport_status = classifyTransport(item); const delivery_used = item?.delivery_used ?? null;
    const rawHash = (value) => typeof value === "string" && /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase() : null;
    const raw_stdout_sha256 = rawHash(item?.raw_stdout_sha256); const raw_stderr_sha256 = rawHash(item?.raw_stderr_sha256);
    const raw_stdout_ref = privateFileHash(directory, item?.raw_stdout_ref, raw_stdout_sha256);
    const raw_stderr_ref = privateFileHash(directory, item?.raw_stderr_ref, raw_stderr_sha256);
    const rawAuditDeclared = item?.raw_stdout_ref !== undefined || item?.raw_stderr_ref !== undefined || item?.raw_stdout_sha256 !== undefined || item?.raw_stderr_sha256 !== undefined;
    const rawAuditComplete = rawAuditDeclared && raw_stdout_ref && raw_stderr_ref && raw_stdout_sha256 && raw_stderr_sha256;
    const base = { provider: item?.provider ?? null, transport_status, packet_status: "material_incomplete", semantic_verdict: null, business_valid: false, delivery_used, session_id: item?.session_id ?? null,
      raw_output_ref: raw_stdout_ref, raw_stdout_ref, raw_stderr_ref, raw_stdout_sha256, raw_stderr_sha256 };
    if (typeof item?.output === "string" && item.provider) {
      const parsed = join(directory, "providers", `${item.provider}.parsed-output.txt`); atomic(parsed, item.output); base.parsed_output_ref = parsed; base.parsed_output_sha256 = sha(readFileSync(parsed));
    }
    if (transport_status === "cancelled") {
      const cancel_source = item?.error?.source;
      if (!cancel_source) return { ...base, cancel_source: null, diagnostic: "CANCEL_SOURCE_MISSING" };
      if (!cancellationSources.has(cancel_source)) return { ...base, cancel_source: null, diagnostic: "CANCEL_SOURCE_INVALID" };
      return { ...base, cancel_source, diagnostic: publicError(item) };
    }
    if (transport_status !== "completed") return { ...base, diagnostic: publicError(item) };
    if (!rawAuditComplete) return { ...base, diagnostic: "BROKER_RAW_AUDIT_MISMATCH" };
    if (item?.delivery_used === undefined || item.delivery_used === null) return { ...base, diagnostic: "DELIVERY_USED_MISSING" };
    if (item.delivery_used !== "file_only" && item.delivery_used !== "always_embed") return { ...base, diagnostic: "DELIVERY_USED_INVALID" };
    if (!capabilities?.attachment_delivery?.includes(item.delivery_used)) return { ...base, diagnostic: "DELIVERY_USED_CAPABILITY_MISMATCH" };
    const delivery = item?.delivery;
    const normalizedDelivery = delivery && typeof delivery === "object" && !Array.isArray(delivery) ? { delivery_mode: delivery.delivery_mode, material_manifest_hash: delivery.material_manifest_hash, material_total_bytes: delivery.material_total_bytes, ...(delivery.rendered_prompt_bytes !== undefined ? { rendered_prompt_bytes: delivery.rendered_prompt_bytes } : {}), provider_visible_attachment_manifest: delivery.provider_visible_attachment_manifest } : null;
    const renderedPromptInvalid = expectedDelivery.delivery_mode === "file_only"
      ? normalizedDelivery?.rendered_prompt_bytes !== undefined
      : !Number.isSafeInteger(normalizedDelivery?.rendered_prompt_bytes) || normalizedDelivery.rendered_prompt_bytes < 0 || normalizedDelivery.rendered_prompt_bytes > 512 * 1024;
    if (!normalizedDelivery || normalizedDelivery.delivery_mode !== expectedDelivery.delivery_mode || normalizedDelivery.material_manifest_hash !== expectedDelivery.material_manifest_hash || normalizedDelivery.material_total_bytes !== expectedDelivery.material_total_bytes || renderedPromptInvalid || canonical(normalizedDelivery.provider_visible_attachment_manifest) !== canonical(expectedDelivery.provider_visible_attachment_manifest)) return { ...base, diagnostic: "DELIVERY_RECORD_MISMATCH" };
    if (intent.initial_runtime_id && item.delivery_used !== initialDelivery?.delivery_mode) return { ...base, diagnostic: "DELIVERY_USED_CONTINUATION_MISMATCH", requires_human_confirmation: true };
    if (item.delivery_used !== expectedDelivery.delivery_mode) return { ...base, diagnostic: "DELIVERY_USED_POLICY_MISMATCH" };
    base.delivery = structuredClone(normalizedDelivery);
    const parsed = parseOutput(item.output); if (!parsed.ok) return { ...base, packet_status: "material_incomplete", diagnostic: "NON_JSON_OUTPUT" };
    const output = parsed.value;
    try { validateSchema("reviewer-output", output); }
    catch (error) {
      if (error instanceof SchemaValidationError) return { ...base, packet_status: "material_incomplete", diagnostic: `${error.code}:${error.pointer || "/"}` };
      throw error;
    }
    if (output.packet_hash !== packet.packet_hash || output.manifest_hash !== packet.manifest_hash || output.diff_sha256 !== packet.diff_sha256 || output.contract_hash !== intent.contract_hash || output.skill_bundle_hash !== intent.skill_bundle_hash) return { ...base, packet_status: "hash_mismatch", diagnostic: "PACKET_HASH_MISMATCH" };
    if (output.packet_status !== "complete") return { ...base, packet_status: output.packet_status ?? "material_incomplete", diagnostic: "PROVIDER_PACKET_INCOMPLETE" };
    const checked = validateReviewerOutput({ stage: intent.stage, reviewTrack: intent.review_track, ui: Boolean(input.ui), output, packet, intent, contractRules });
    if (!checked.valid) return { ...base, packet_status: "complete", diagnostic: "BUSINESS_INVALID" };
    let findings; try { findings = output.findings.map((finding) => projectFinding(finding, item.provider)); }
    catch (error) { return { ...base, packet_status: "complete", diagnostic: error.message }; }
    return { ...base, packet_status: "complete", semantic_verdict: output.verdict, business_valid: true, findings, summary: output.summary, checklist: output.checklist, pass_items: output.pass_items, skillResults: output.skillResults };
  }

  publish(result, dispositions) {
    // Invalid result locators remain a pure schema failure. With a trusted
    // locator, though, a malformed disposition is still a real resubmission
    // and must consume the same bounded attempt budget as a semantic error.
    let dispositionSchemaError = null;
    try { validateSchema("dispositions", dispositions); }
    catch (error) { dispositionSchemaError = error; }
    try { validateSchema("round-run-result", result); }
    catch (error) { if (dispositionSchemaError) throw dispositionSchemaError; throw error; }
    const lock = this.#acquireLock({ ...result.intent, idempotency_key: sha(`publish\0${result.intent.task_id}\0${result.intent.stage}\0${result.intent.review_track ?? "default"}\0${result.intent.review_flow_id}\0${result.receipt_draft_ref}`) });
    let taskLock = null;
    try {
      if (result.intent.stage === "make-decision") taskLock = this.#taskProjectionLock(result.intent.task_id, `publish-${result.intent.review_flow_id}`);
      const trusted = this.#trustedResult(result);
      try {
        if (dispositionSchemaError) throw dispositionSchemaError;
        return this.#publishUnderLock(trusted, dispositions);
      } catch (error) {
        const dispositionFailure = (error instanceof SchemaValidationError && error.schema === "dispositions") || /^(invalid disposition|hard invariant finding cannot be accepted|every finding requires exactly one disposition)$/.test(String(error?.message ?? ""));
        if (dispositionFailure && !trusted.blocked_by_human_confirmation) {
          const attempts = this.#recordDispositionFailure(trusted, error);
          if (attempts >= trusted.intent.limits.max_disposition_attempts) throw new Error(`DISPOSITION_ATTEMPTS_EXCEEDED: ${attempts}/${trusted.intent.limits.max_disposition_attempts}; human confirmation is required`);
        }
        throw error;
      }
    } finally { if (taskLock) this.#releaseLock(taskLock); this.#releaseLock(lock); }
  }
  #recordDispositionFailure(result, error) {
    const receipt = JSON.parse(readFileSync(result.receipt_draft_ref, "utf8"));
    const attempts = Number.isSafeInteger(receipt.disposition_attempts) ? receipt.disposition_attempts + 1 : 1;
    receipt.disposition_attempts = attempts;
    receipt.disposition_last_error = String(error?.message ?? error).slice(0, 512);
    if (attempts >= result.intent.limits.max_disposition_attempts) receipt.blocked_by_human_confirmation = true;
    this.#updateReceiptAndFlow(result.intent, result.receipt_draft_ref, receipt);
    return attempts;
  }
  #trustedResult(locator) {
    const receiptPath = resolve(locator.receipt_draft_ref);
    const expectedPath = join(this.#root(locator.intent), "round-receipt.json");
    if (receiptPath !== expectedPath || !existsSync(receiptPath)) throw new Error("private receipt binding is invalid");
    const flow = this.#readFlow(locator.intent);
    const receiptBytes = readFileSync(receiptPath);
    if (!flow || resolve(flow.previous_receipt_ref ?? "") !== receiptPath || flow.previous_receipt_sha256 !== sha(receiptBytes)) throw new Error("private receipt is not bound to the current flow");
    let receipt;
    try { receipt = JSON.parse(receiptBytes); } catch { throw new Error("private receipt is invalid JSON"); }
    if (canonical(receipt.intent) !== canonical(locator.intent)) throw new Error("private receipt intent binding is invalid");
    const trusted = { intent: receipt.intent, round_kind: receipt.intent.round_kind, baseline_packet_hash: receipt.intent.baseline_packet_hash,
      previous_findings: receipt.delta?.previous_findings ?? [], closure_evidence: receipt.delta?.closure_evidence ?? [], delta_manifest: receipt.delta?.delta_manifest ?? null,
      affected_materials: receipt.delta?.affected_materials ?? {}, current_material_manifest: receipt.delta?.current_material_manifest ?? {},
      cross_stage_carryovers: receipt.delta?.cross_stage_carryovers ?? [], required_skill_lens_hashes: receipt.delta?.required_skill_lens_hashes ?? [],
      provider_outcomes: receipt.provider_outcomes, merged_findings: receipt.merged_findings, hard_gates: receipt.hard_gates,
      human_gates: receipt.human_gates ?? deriveHumanGates(receipt.provider_outcomes), blocked_by_human_confirmation: receipt.blocked_by_human_confirmation === true,
      continuation_eligible: receipt.continuation_eligible, receipt_draft_ref: receiptPath };
    return validateSchema("round-run-result", trusted);
  }
  #latestAuthorizedMakeDecisionTrack(taskId, reviewFlowId, reviewTrack) {
    const flowsRoot = join(taskRoot(this.taskTrackingRoot, taskId), "reviews", "private", "flows");
    if (!existsSync(flowsRoot)) return null;
    const candidates = readdirSync(flowsRoot).filter((name) => name.endsWith(".json") && !name.endsWith(".reset-approval.json")).map((name) => {
      try { return JSON.parse(readFileSync(join(flowsRoot, name), "utf8")); } catch { return null; }
    }).filter((flow) => flow?.stage === "make-decision" && flow.review_flow_id === reviewFlowId && flow.review_track === reviewTrack && typeof flow.core_receipt_hash === "string" && typeof flow.previous_receipt_ref === "string");
    candidates.sort((left, right) => (right.published_at_ms ?? 0) - (left.published_at_ms ?? 0));
    const flow = candidates[0]; if (!flow) return null;
    const corePath = join(dirname(resolve(flow.previous_receipt_ref)), "core-receipt.json");
    if (!existsSync(corePath) || sha(readFileSync(corePath)) !== flow.core_receipt_hash) throw new Error("make-decision aggregate core receipt binding is invalid");
    const core = JSON.parse(readFileSync(corePath, "utf8"));
    if (core?.intent?.stage !== "make-decision" || core.intent.review_track !== reviewTrack || core.semantic_verdict === null) throw new Error("make-decision aggregate track receipt is invalid");
    return { ...core, core_receipt_hash: flow.core_receipt_hash, review_flow_id: flow.review_flow_id, approved_tree: flow.approved_tree ?? null };
  }
  // This is deliberately a private authority step.  A make-decision pass is
  // not a stage pass until both isolated tracks bind the same tree and the
  // task source context accepts that tree.  Keep it before every public
  // projection so a failed context write cannot leak a track-level PASS.
  #prepareMakeDecisionAggregateAuthority(taskId, reviewFlowId) {
    assertSafeReviewFlowId(reviewFlowId);
    const direction = this.#latestAuthorizedMakeDecisionTrack(taskId, reviewFlowId, "direction");
    const detail = this.#latestAuthorizedMakeDecisionTrack(taskId, reviewFlowId, "detail");
    if (!direction || !detail) return null;
    const aggregate = aggregateMakeDecisionTracks({ direction, detail });
    if (!aggregate.semantic_verdict) throw new Error("make-decision aggregate requires semantic verdicts from both tracks");
    if (aggregate.semantic_verdict === "pass") {
      if (!/^[a-f0-9]{40,64}$/.test(direction.approved_tree ?? "") || direction.approved_tree !== detail.approved_tree) {
        throw new Error("MAKE_DECISION_TRACK_SNAPSHOT_MISMATCH: direction and detail must pass the same source tree");
      }
      this.#recordLastApprovedTree(taskId, direction.approved_tree);
    }
    const aggregateCore = {
      version: 1, stage: "make-decision", review_flow_id: reviewFlowId, review_tracks: ["direction", "detail"],
      track_core_receipt_hashes: { direction: direction.core_receipt_hash, detail: detail.core_receipt_hash },
      track_review_flow_ids: { direction: direction.review_flow_id, detail: detail.review_flow_id },
      semantic_verdict: aggregate.semantic_verdict, needs_human: aggregate.needs_human, merged_findings: aggregate.findings,
    };
    return { direction, detail, aggregate, aggregateCore, coreHash: sha(safeJson(aggregateCore)) };
  }
  #writeMakeDecisionTrackProjection(track) {
    const intent = track.intent;
    const receiptPath = resolve(this.#readFlow(intent)?.previous_receipt_ref ?? "");
    const dir = dirname(receiptPath);
    const corePath = join(dir, "core-receipt.json");
    if (!existsSync(corePath) || sha(readFileSync(corePath)) !== track.core_receipt_hash) throw new Error("make-decision track core receipt is unavailable");
    const publicCorePath = this.#publicCorePath(intent, track.core_receipt_hash);
    this.faultInjector("before-public-core-write"); atomic(publicCorePath, readFileSync(corePath), 0o644);
    const report = `# 审查报告\n\n结论：${track.semantic_verdict === "revise_required" ? "需要修改" : track.semantic_verdict === "pass" ? "通过" : "需要人工确认"}\n\n- 有效审查：${(track.provider_outcomes ?? []).filter((item) => item.business_valid).length}\n- Findings：${(track.merged_findings ?? []).length}\n`;
    const { reportPath, indexPath, stageResultPath } = this.#publicPaths(intent);
    this.faultInjector("before-public-report-write"); atomic(reportPath, report, 0o644);
    this.faultInjector("before-public-index-write"); atomic(indexPath, safeJson({ stage: intent.stage, review_track: intent.review_track, core_receipt_hash: track.core_receipt_hash, semantic_verdict: track.semantic_verdict, needs_human: track.needs_human, report: relative(dirname(indexPath), reportPath) }), 0o644);
    this.faultInjector("before-public-stage-result"); atomic(stageResultPath, safeJson({ stage: intent.stage, review_track: intent.review_track, core_receipt_hash: track.core_receipt_hash, semantic_verdict: track.semantic_verdict, verdict: track.semantic_verdict, needs_human: track.needs_human }), 0o644);
    const projectionPath = join(dir, "projection-manifest.json");
    const projection = existsSync(projectionPath) ? JSON.parse(readFileSync(projectionPath, "utf8")) : { version: 1, done_flags: {} };
    projection.done_flags = { ...(projection.done_flags ?? {}), core_receipt: true, public_core_receipt: true, report: true, report_index: true, stage_result: true };
    atomic(projectionPath, safeJson(projection));
    return { core_receipt_ref: publicCorePath, report_ref: reportPath, report_index_ref: indexPath, stage_result_ref: stageResultPath };
  }
  #publishMakeDecisionAggregate(taskId, reviewFlowId, authority = null) {
    authority ??= this.#prepareMakeDecisionAggregateAuthority(taskId, reviewFlowId);
    if (!authority) return null;
    const { direction, detail, aggregate, aggregateCore, coreHash } = authority;
    const track_projections = {
      direction: this.#writeMakeDecisionTrackProjection(direction),
      detail: this.#writeMakeDecisionTrackProjection(detail),
    };
    const reviews = join(taskRoot(this.taskTrackingRoot, taskId), "reviews");
    const group = `make-decision-${reviewFlowId}`;
    const corePath = join(reviews, `${group}-aggregate-core-receipt.json`); this.faultInjector("before-public-aggregate-core-write"); atomic(corePath, safeJson(aggregateCore), 0o644);
    const reportPath = join(reviews, `${group}-aggregate.md`); this.faultInjector("before-public-aggregate-report-write"); atomic(reportPath, `# Make Decision 汇总审查报告\n\n结论：${aggregate.semantic_verdict}\n\n- direction flow：${direction.review_flow_id}\n- detail flow：${detail.review_flow_id}\n- Findings：${aggregate.findings.length}\n`, 0o644);
    const indexPath = join(reviews, `report-index-${group}.json`); this.faultInjector("before-public-aggregate-index-write"); atomic(indexPath, safeJson({ stage: "make-decision", review_flow_id: reviewFlowId, review_tracks: ["direction", "detail"], core_receipt_hash: coreHash, semantic_verdict: aggregate.semantic_verdict, needs_human: aggregate.needs_human, report: relative(dirname(indexPath), reportPath) }), 0o644);
    const stageResultPath = join(reviews, `stage-result-${group}.json`); this.faultInjector("before-public-aggregate-stage-result"); atomic(stageResultPath, safeJson({ stage: "make-decision", review_flow_id: reviewFlowId, review_tracks: ["direction", "detail"], core_receipt_hash: coreHash, verdict: aggregate.semantic_verdict, semantic_verdict: aggregate.semantic_verdict, needs_human: aggregate.needs_human }), 0o644);
    for (const track of [direction, detail]) {
      const receiptPath = resolve(this.#readFlow(track.intent)?.previous_receipt_ref ?? "");
      if (existsSync(this.#projectionGuardPath(track.intent))) this.#completeProjection(track.intent, receiptPath);
      else {
        const trackReceipt = JSON.parse(readFileSync(receiptPath, "utf8")); const trackFlow = this.#readFlow(track.intent);
        if (trackReceipt.projection_pending !== undefined || trackFlow?.projection_pending !== undefined) throw new Error("PROJECTION_RECOVERY_GUARD_MISSING: aggregate track still has pending projection state");
      }
    }
    return { semantic_verdict: aggregate.semantic_verdict, core_receipt_hash: coreHash, needs_human: aggregate.needs_human, core_receipt_ref: corePath, report_ref: reportPath, report_index_ref: indexPath, stage_result_ref: stageResultPath, track_projections };
  }
  #publishUnderLock(result, dispositions) {
    if (result.blocked_by_human_confirmation) throw new Error("human confirmation is required before publication");
    if (!result.provider_outcomes.some((item) => item.business_valid && item.semantic_verdict)) throw new Error("no business-valid provider outcome to publish");
    const provider_human_gates = deriveHumanGates(result.provider_outcomes);
    const state_human_gates = (result.human_gates ?? []).filter((gate) => gate?.provider === null && gate?.verdict === "escalate_to_human");
    if (canonical(result.human_gates ?? []) !== canonical([...provider_human_gates, ...state_human_gates])) throw new Error("human gate provenance does not match provider outcomes or finding state");
    const human_gates = [...provider_human_gates, ...state_human_gates];
    if (human_gates.length) throw new Error("human gate requires explicit human confirmation before publication");
    const byId = new Map(result.merged_findings.map((item) => [item.finding_id, item])); const hardGateIds = new Set(result.hard_gates.map((item) => item.finding_id)); const seen = new Set();
    for (const item of dispositions.items) { const finding = byId.get(item.finding_id); if (!finding || seen.has(item.finding_id) || !["accept", "reject", "defer"].includes(item.action) || !item.evidence) throw new Error("invalid disposition"); seen.add(item.finding_id); if (hardGateIds.has(finding.finding_id) && item.action === "accept") throw new Error("hard invariant finding cannot be accepted"); }
    if (seen.size !== byId.size) throw new Error("every finding requires exactly one disposition");
    const semantic_verdict = result.hard_gates.length || result.provider_outcomes.some((item) => item.business_valid && item.semantic_verdict === "revise_required") ? "revise_required" : "pass";
    const needs_human = semantic_verdict !== "pass";
    const receiptBefore = readFileSync(result.receipt_draft_ref);
    const flowBefore = this.#readFlow(result.intent);
    const sourceContextPath = this.#sourceContext(result.intent.task_id);
    const sourceContextBefore = existsSync(sourceContextPath) ? readFileSync(sourceContextPath) : null;
    const pending = this.#ensureProjectionGuard(result.intent);
    const privateReceipt = JSON.parse(receiptBefore); privateReceipt.dispositions = dispositions.items; privateReceipt.projection_pending = pending;
    const dir = dirname(result.receipt_draft_ref); const core = projectPublicReviewCore({ version: 1, intent: result.intent, semantic_verdict, needs_human, merged_findings: result.merged_findings, hard_gates: result.hard_gates, dispositions: dispositions.items, provider_outcomes: result.provider_outcomes }, { sensitiveSource: privateReceipt });
    const coreBytes = safeJson(core); const coreHash = sha(coreBytes);
    const privateCorePath = join(dir, "core-receipt.json");
    const privateCoreBefore = existsSync(privateCorePath) ? readFileSync(privateCorePath) : null;
    let aggregateAuthority = null;
    // Persist all authority-bearing private state before writing any artifact
    // that a CI consumer can treat as a pass. The receipt journal makes the
    // receipt/flow transition recoverable; this small compensation block is
    // only for a failure before public projection begins.
    // A failure inside the journalled receipt transition is deliberately left
    // to #recoverPendingReceiptBinding on the next operation. Compensation
    // starts only after that recovery unit has completed.
    this.#updateReceiptAndFlow(result.intent, result.receipt_draft_ref, privateReceipt);
    try {
      const flow = this.#readFlow(result.intent);
      if (!flow) throw new Error("publication flow is missing");
      // A crash may leave an orphan private core, but never a flow authority
      // that points at a core receipt which has not been persisted yet.
      if (result.intent.stage === "make-decision") atomic(privateCorePath, coreBytes);
      const publishedFlow = { ...flow, core_receipt_hash: coreHash, previous_receipt_sha256: sha(readFileSync(result.receipt_draft_ref)), projection_pending: pending, published_at_ms: this.now(), ...(semantic_verdict === "pass" ? { approved_tree: flow.last_reviewed_tree } : {}) };
      this.#writeFlow(result.intent, publishedFlow);
      if (result.intent.stage === "make-decision") {
        // The private core is aggregate authority, not a public projection.
        // It must exist before the sibling track can be verified, while the
        // task source context must succeed before either track becomes public.
        aggregateAuthority = this.#prepareMakeDecisionAggregateAuthority(result.intent.task_id, result.intent.review_flow_id);
      } else if (semantic_verdict === "pass") this.#recordLastApprovedTree(result.intent.task_id, publishedFlow.approved_tree);
    } catch (error) {
      // No public artifact has been written yet. Restore the three private
      // records as one unit, including the receipt-update journal, so retry
      // starts from the exact pre-publication state.
      atomic(result.receipt_draft_ref, receiptBefore);
      if (flowBefore) this.#writeFlow(result.intent, flowBefore);
      else rmSync(this.#flow(result.intent), { force: true });
      if (sourceContextBefore) atomic(sourceContextPath, sourceContextBefore);
      else rmSync(sourceContextPath, { force: true });
      if (privateCoreBefore) atomic(privateCorePath, privateCoreBefore);
      else rmSync(privateCorePath, { force: true });
      rmSync(join(dirname(result.receipt_draft_ref), "receipt-update-journal.json"), { force: true });
      throw error;
    }
    if (result.intent.stage === "make-decision") {
      const aggregate = aggregateAuthority ? this.#publishMakeDecisionAggregate(result.intent.task_id, result.intent.review_flow_id, aggregateAuthority) : null;
      const projection = aggregate?.track_projections?.[result.intent.review_track] ?? null;
      return { semantic_verdict, core_receipt_hash: coreHash, needs_human, core_receipt_ref: projection?.core_receipt_ref ?? null, report_ref: projection?.report_ref ?? null, report_index_ref: projection?.report_index_ref ?? null, stage_result_ref: projection?.stage_result_ref ?? null, aggregate };
    }
    const projection = join(dir, "projection-manifest.json"); const done = existsSync(projection) ? JSON.parse(readFileSync(projection, "utf8")) : { version: 1, done_flags: {} };
    const corePath = join(dir, "core-receipt.json"); this.faultInjector("before-private-core-write"); atomic(corePath, coreBytes); done.done_flags.core_receipt = true; atomic(projection, safeJson(done));
    const publicCorePath = this.#publicCorePath(result.intent, coreHash); this.faultInjector("before-public-core-write"); atomic(publicCorePath, readFileSync(corePath), 0o644); done.done_flags.public_core_receipt = true; atomic(projection, safeJson(done));
    const report = `# 审查报告\n\n结论：${semantic_verdict === "revise_required" ? "需要修改" : "通过"}\n\n- 有效审查：${result.provider_outcomes.filter((item) => item.business_valid).length}\n- Findings：${result.merged_findings.length}\n`;
    const { reportPath, indexPath, stageResultPath } = this.#publicPaths(result.intent);
    this.faultInjector("before-public-report-write"); atomic(reportPath, report, 0o644); done.done_flags.report = true; atomic(projection, safeJson(done));
    this.faultInjector("before-public-index-write"); atomic(indexPath, safeJson({ stage: result.intent.stage, review_track: result.intent.review_track, core_receipt_hash: coreHash, semantic_verdict, needs_human, report: relative(dirname(indexPath), reportPath) }), 0o644); done.done_flags.report_index = true; atomic(projection, safeJson(done));
    this.faultInjector("before-public-stage-result"); atomic(stageResultPath, safeJson({ stage: result.intent.stage, review_track: result.intent.review_track, core_receipt_hash: coreHash, semantic_verdict, verdict: semantic_verdict, needs_human }), 0o644); done.done_flags.stage_result = true; atomic(projection, safeJson(done));
    this.#completeProjection(result.intent, result.receipt_draft_ref);
    const aggregate = result.intent.stage === "make-decision" ? this.#publishMakeDecisionAggregate(result.intent.task_id, result.intent.review_flow_id) : null;
    return { semantic_verdict, core_receipt_hash: coreHash, needs_human, core_receipt_ref: publicCorePath, report_ref: reportPath, report_index_ref: indexPath, stage_result_ref: stageResultPath, aggregate };
  }
  reset({ task_id, stage, review_track = null, review_flow_id, new_review_flow_id, reason, human_approval_ref }) {
    assertSafeTaskId(task_id); assertKnownStage(stage); assertReviewTrack(stage, review_track); assertSafeReviewFlowId(review_flow_id); if (!reason || !human_approval_ref) throw new Error("reset requires reason and human_approval_ref");
    const nextId = new_review_flow_id ?? `${review_flow_id}-reset-${this.now()}`; assertSafeReviewFlowId(nextId);
    let flow = { task_id, stage, review_track, review_flow_id: nextId, parent_review_flow_id: review_flow_id, reset_at_ms: this.now(), reason, human_approval_ref, initial_runtime_id: null, continuation_eligible: false, business_round: 0 };
    const lock = this.#acquireLock({ ...flow, idempotency_key: sha(`reset\0${task_id}\0${stage}\0${review_track ?? "default"}\0${review_flow_id}\0${nextId}\0${human_approval_ref}`) });
    try {
      const previous = this.#readFlow({ task_id, stage, review_track, review_flow_id });
      const flowPath = this.#flow(flow), approvalPath = this.#resetApproval(flow);
      const approval = { version: 1, task_id, stage, review_track, review_flow_id: nextId, parent_review_flow_id: review_flow_id, human_approval_ref, reason, approved_at_ms: this.now() };
      if (existsSync(approvalPath)) {
        const savedApproval = JSON.parse(readFileSync(approvalPath, "utf8"));
        if (!(savedApproval?.version === 1 && savedApproval.task_id === task_id && savedApproval.stage === stage && (savedApproval.review_track ?? null) === review_track && savedApproval.review_flow_id === nextId && savedApproval.parent_review_flow_id === review_flow_id && savedApproval.human_approval_ref === human_approval_ref && savedApproval.reason === reason)) throw new Error("reset approval does not match requested reset");
      } else writeImmutable(approvalPath, approval);
      // Both records are create-exclusive. Until they exist, no old gate has a
      // supersession marker, so a partial reset remains blocked.
      if (existsSync(flowPath)) {
        const savedFlow = JSON.parse(readFileSync(flowPath, "utf8"));
        if (!(savedFlow?.task_id === task_id && savedFlow.stage === stage && (savedFlow.review_track ?? null) === review_track
          && savedFlow.review_flow_id === nextId && savedFlow.parent_review_flow_id === review_flow_id
          && savedFlow.reason === reason && savedFlow.human_approval_ref === human_approval_ref
          && Number.isFinite(savedFlow.reset_at_ms) && savedFlow.initial_runtime_id === null
          && savedFlow.continuation_eligible === false && savedFlow.business_round === 0)) throw new Error("reset flow does not match requested reset");
        flow = savedFlow;
      } else writeImmutable(flowPath, flow);
      const privateRoot = join(taskRoot(this.taskTrackingRoot, task_id), "reviews", "private"); const approvalBytes = readFileSync(approvalPath);
      const superseded_receipt_refs = this.#markResetResolvedGates({ task_id, stage, review_track, review_flow_id, new_review_flow_id: nextId, reset_approval_ref: relative(privateRoot, approvalPath), reset_approval_sha256: sha(approvalBytes), reason, human_approval_ref });
      // Keep the old snapshot alive until the successor flow and every
      // supersession marker are durably written; otherwise a failed reset
      // would destroy the only reproducible review source.
      if (typeof previous?.review_tree_ref === "string") deleteReviewTreeRef(this.sourceRoot, previous.review_tree_ref);
      return { ...flow, reset_approval_ref: relative(privateRoot, approvalPath), superseded_receipt_refs };
    } finally { this.#releaseLock(lock); }
  }

  verifyFinal({ task_id, stage, review_track = null, review_flow_id }) {
    assertSafeTaskId(task_id); assertKnownStage(stage); assertReviewTrack(stage, review_track); assertSafeReviewFlowId(review_flow_id);
    const intent = { task_id, stage, review_track, review_flow_id };
    const flow = this.#readFlow(intent);
    if (!/^[a-f0-9]{40,64}$/.test(flow?.approved_tree ?? "")) throw new Error("FINAL_REVIEW_TREE_MISSING: publish a semantic pass before final verification");
    const current = captureWorktreeTree(this.sourceRoot, { baseTree: flow.approved_tree, excludePaths: internalLedgerExclusion(this.sourceRoot, this.taskTrackingRoot, task_id) });
    if (current !== flow.approved_tree) {
      const error = new Error(`WORKTREE_DRIFT_AFTER_REVIEW: current tree ${current} differs from approved tree ${flow.approved_tree}`);
      error.code = "WORKTREE_DRIFT_AFTER_REVIEW";
      throw error;
    }
    this.#writeFlow(intent, { ...flow, review_tree_ref: null, finalized_at_ms: this.now() });
    try { if (typeof flow.review_tree_ref === "string") deleteReviewTreeRef(this.sourceRoot, flow.review_tree_ref); }
    catch (error) { this.#writeFlow(intent, flow); throw error; }
    return { task_id, stage, review_track, review_flow_id, approved_tree: flow.approved_tree, finalized: true };
  }
}
