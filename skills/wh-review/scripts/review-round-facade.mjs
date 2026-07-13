import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { projectStageContract, assertKnownStage, assertReviewTrack, assertSafeReviewFlowId, assertSafeTaskId, reviewFlowStorageKey, reviewStageStorageKey, taskRoot } from "./lib/safe-id.mjs";
import { validateReviewerOutput } from "./reviewer-output-validator.mjs";
import { resolveRequiredSkills } from "./required-skill-resolver.mjs";
import { buildContinuationDelta, continuationPrompt, initialPrompt } from "./review-prompt.mjs";
import { projectPublicReviewCore } from "./public-review-projection.mjs";
import { SchemaValidationError, validateSchema } from "./schema-validator.mjs";
import { reconcileFindingState, aggregateMakeDecisionTracks, isBlocking, mergeCrossStageCarryovers, validateClosureBundle } from "./finding-state.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
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
function packetHash(packet) { const input = { ...packet }; delete input.packet_hash; return sha(canonical(input)); }
function safeRelativePath(value) { return typeof value === "string" && value.length > 0 && !value.includes("\\") && !value.startsWith("/") && !value.split("/").some((part) => !part || part === "." || part === ".."); }
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
function manifestValue(packet) {
  const { packet_hash, manifest_hash, ...materials } = packet;
  return { diff_sha256: materials.diff_sha256, changed_files: materials.changed_files.map(({ path, old_path, status, sha256, size, old_sha256, old_size }) => ({ path, old_path: old_path ?? null, status, sha256: sha256 ?? null, size: size ?? null, old_sha256: old_sha256 ?? null, old_size: old_size ?? null })), raw_requirement: materials.raw_requirement, decision_log_excerpt: materials.decision_log_excerpt ?? null, acceptance_design_excerpt: materials.acceptance_design_excerpt ?? null, planning_artifacts: materials.planning_artifacts ?? [], verification_closure: materials.verification_closure ?? [], test_evidence: materials.test_evidence ?? [], host_verified_facts: materials.host_verified_facts, contract_hash: materials.contract_hash, skill_bundle_hash: materials.skill_bundle_hash, source_revision: materials.source_revision };
}
function sealPacket(packet) {
  validateSchema("review-packet", packet);
  const diff = sha(packet.unified_diff);
  if (packet.diff_sha256 && packet.diff_sha256 !== diff) throw new Error("diff_sha256 mismatch");
  packet.diff_sha256 = diff;
  // Git owns diff syntax (multiple hunks, mode/index records, binary patches,
  // and quoted paths). Exact comparison with buildHostGitSource below is the
  // source-evidence check; do not impose a hand-written diff grammar here.
  for (const entry of packet.changed_files) {
    if (!entry || !safeRelativePath(entry.path) || !["added", "modified", "deleted", "renamed"].includes(entry.status)) throw new Error("invalid changed_files entry");
    const needsCurrent = entry.status !== "deleted";
    if (needsCurrent && (!/^[a-f0-9]{64}$/.test(entry.sha256 ?? "") || !Number.isSafeInteger(entry.size) || entry.size < 0)) throw new Error("invalid changed_files current snapshot");
    if (["modified", "deleted", "renamed"].includes(entry.status) && (!/^[a-f0-9]{64}$/.test(entry.old_sha256 ?? "") || !Number.isSafeInteger(entry.old_size) || entry.old_size < 0)) throw new Error("invalid changed_files base snapshot");
    if (entry.status === "renamed" && !safeRelativePath(entry.old_path)) throw new Error("renamed changed_files entry requires old_path");
  }
  const manifest = sha(canonical(manifestValue(packet)));
  if (packet.manifest_hash && packet.manifest_hash !== manifest) throw new Error("manifest_hash mismatch");
  packet.manifest_hash = manifest;
  packet.packet_hash = packetHash(packet);
  return packet;
}
function hostGit(root, args, encoding = "utf8") {
  try { return execFileSync("git", args, { cwd: root, encoding, maxBuffer: 32 * 1024 * 1024 }); }
  catch (error) { throw new Error(`host git source builder failed: ${String(error.stderr ?? error.message).trim()}`); }
}
function processStartIdentity(pid) {
  try {
    const value = String(execFileSync("ps", ["-o", "lstart=", "-p", String(pid)], { encoding: "utf8" })).trim();
    return value || null;
  } catch { return null; }
}
function gitBlob(root, revision, path) { return hostGit(root, ["show", `${revision}:${path}`], undefined); }
function buildHostGitSource(repositoryRoot, requestedRevision) {
  if (!requestedRevision || typeof requestedRevision.base !== "string" || typeof requestedRevision.head !== "string") throw new Error("source_revision.base and source_revision.head are required");
  const root = realpathSync(resolve(repositoryRoot));
  const gitRoot = realpathSync(resolve(String(hostGit(root, ["rev-parse", "--show-toplevel"])).trim()));
  if (gitRoot !== root) throw new Error("repository_root must be the host git repository root");
  const base = String(hostGit(root, ["rev-parse", "--verify", `${requestedRevision.base}^{commit}`])).trim();
  const head = String(hostGit(root, ["rev-parse", "--verify", `${requestedRevision.head}^{commit}`])).trim();
  if (requestedRevision.base !== base || requestedRevision.head !== head) throw new Error("source_revision must use immutable resolved commit ids");
  const unified_diff = String(hostGit(root, ["diff", "--no-ext-diff", "--binary", "--find-renames", "--full-index", base, head]));
  const fields = String(hostGit(root, ["diff", "--name-status", "-z", "--find-renames", base, head])).split("\0");
  const changed_files = [];
  for (let index = 0; index < fields.length - 1;) {
    const statusToken = fields[index++]; if (!statusToken) continue;
    const kind = statusToken[0];
    if (!["A", "M", "D", "R"].includes(kind)) throw new Error(`unsupported host git change status: ${statusToken}`);
    const old_path = kind === "R" ? fields[index++] : null; const path = fields[index++];
    if (!safeRelativePath(path) || (old_path !== null && !safeRelativePath(old_path))) throw new Error("host git source contains unsafe path");
    const entry = { path, status: ({ A: "added", M: "modified", D: "deleted", R: "renamed" })[kind] };
    if (old_path !== null) entry.old_path = old_path;
    if (kind !== "D") { const bytes = gitBlob(root, head, path); entry.sha256 = sha(bytes); entry.size = bytes.length; }
    if (kind !== "A") { const bytes = gitBlob(root, base, old_path ?? path); entry.old_sha256 = sha(bytes); entry.old_size = bytes.length; }
    changed_files.push(entry);
  }
  return { source_revision: { base, head }, unified_diff, changed_files };
}
function verifyHostGitSource(packet, repositoryRoot) {
  const built = buildHostGitSource(repositoryRoot, packet.source_revision);
  const normalizeChangedFiles = (entries) => entries.map((entry) => {
    const normalized = { ...entry };
    if (normalized.status !== "renamed" && normalized.old_path === null) delete normalized.old_path;
    return normalized;
  });
  if (packet.unified_diff !== built.unified_diff || canonical(normalizeChangedFiles(packet.changed_files)) !== canonical(normalizeChangedFiles(built.changed_files))) throw new Error("review packet source evidence does not match host git base/head revisions");
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
function checkedCarryovers(value, previousFindings) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error("cross_stage_carryovers must be an array");
  const oldIds = new Set(previousFindings.map((finding) => finding.finding_id)); const seen = new Set();
  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item) || Object.hasOwn(item, "finding_id") || oldIds.has(item.carryover_id)) throw new Error("cross_stage_carryovers cannot contain a previous finding");
    const allowed = new Set(["carryover_id", "source_stage", "status", "evidence"]);
    if (Object.keys(item).some((key) => !allowed.has(key)) || typeof item.carryover_id !== "string" || !item.carryover_id || seen.has(item.carryover_id)
      || !["open", "closed", "deferred"].includes(item.status) || typeof item.evidence !== "string" || !item.evidence.trim()) throw new Error("cross_stage_carryovers requires explicit carryover_id, status, and evidence fields");
    seen.add(item.carryover_id); return structuredClone(item);
  });
}

export class ReviewRoundFacade {
  constructor({ taskTrackingRoot, broker, skillsRoot, now = () => Date.now(), continuationPromptMaxBytes = 524288, initialPromptMaxBytes = 524288, maxDispositionAttempts = 3, requiredSkillResolver = resolveRequiredSkills, faultInjector = () => {} } = {}) {
    if (!taskTrackingRoot) throw new TypeError("taskTrackingRoot is required"); if (!broker?.run) throw new TypeError("broker.run is required");
    if (!Number.isSafeInteger(continuationPromptMaxBytes) || continuationPromptMaxBytes < 1) throw new TypeError("continuationPromptMaxBytes must be a positive integer");
    if (!Number.isSafeInteger(initialPromptMaxBytes) || initialPromptMaxBytes < 1) throw new TypeError("initialPromptMaxBytes must be a positive integer");
    if (!Number.isSafeInteger(maxDispositionAttempts) || maxDispositionAttempts < 1) throw new TypeError("maxDispositionAttempts must be a positive integer");
    if (typeof requiredSkillResolver !== "function") throw new TypeError("requiredSkillResolver must be a function");
    if (typeof faultInjector !== "function") throw new TypeError("faultInjector must be a function");
    this.taskTrackingRoot = resolve(taskTrackingRoot); this.broker = broker; this.skillsRoot = resolve(skillsRoot ?? repositoryRoot); this.now = now;
    this.continuationPromptMaxBytes = continuationPromptMaxBytes; this.initialPromptMaxBytes = initialPromptMaxBytes; this.maxDispositionAttempts = maxDispositionAttempts; this.requiredSkillResolver = requiredSkillResolver; this.faultInjector = faultInjector;
  }
  #root(intent) { return join(taskRoot(this.taskTrackingRoot, intent.task_id), "reviews", "private", `round-${reviewFlowStorageKey(intent.stage, intent.review_track, intent.review_flow_id)}-${intent.business_round}`); }
  #flow(intent) { return join(taskRoot(this.taskTrackingRoot, intent.task_id), "reviews", "private", "flows", `${reviewFlowStorageKey(intent.stage, intent.review_track, intent.review_flow_id)}.json`); }
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
  #readFlow(intent) { const path = this.#flow(intent); return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null; }
  #writeFlow(intent, value) { atomic(this.#flow(intent), safeJson(value)); }

  prepare(input) {
    assertSafeTaskId(input.task_id); assertKnownStage(input.stage); assertReviewTrack(input.stage, input.review_track ?? null); assertSafeReviewFlowId(input.review_flow_id);
    if (input.source_snapshot !== undefined || input.sourceSnapshot !== undefined) throw new Error("source_snapshot is not accepted; wh-review builds source evidence from host git revisions");
    if (input.provider_capabilities !== undefined || input.providerCapabilities !== undefined) throw new Error("provider_capabilities are broker-owned; caller capability assertions are rejected");
    if (input.attachment_delivery !== undefined || input.attachmentDelivery !== undefined) throw new Error("attachment_delivery comes only from stage-skill-plan resolution; caller delivery assertions are rejected");
    if (input.allow_contract_hash_override !== undefined) throw new Error("contract hash override is rejected; packet hash must bind the frozen projected contract");
    const lock = this.#acquireLock({ task_id: input.task_id, stage: input.stage, review_track: input.review_track ?? null, idempotency_key: sha(`prepare\0${input.task_id}\0${input.stage}\0${input.review_track ?? "default"}\0${input.review_flow_id}`) });
    return this.#prepareUnderLock(input, lock);
  }

  async #prepareUnderLock(input, lock) {
    try {
    for (const field of ["previous_findings", "delta_manifest", "affected_materials", "current_material_manifest", "required_skill_lens_hashes"]) if (input[field] !== undefined) throw new Error(`${field} is derived by wh-review and caller values are rejected`);
    if (input.continuation_prompt_max_bytes !== undefined || input.continuationPromptMaxBytes !== undefined) throw new Error("caller continuation prompt limit is rejected; the host owns this limit");
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
    if (continuation && (!prior?.initial_delivery_by_provider || typeof prior.initial_delivery_by_provider !== "object")) throw new Error("blocked_by_human_confirmation: initial provider delivery snapshot is missing; use reset with human approval");
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
      if (packet.source_revision?.base !== baselinePacket.source_revision?.base) throw new Error("blocked_by_human_confirmation: current packet is not based on the frozen baseline; use reset with human approval");
      if (packet.round_kind !== undefined && packet.round_kind !== "continuation") throw new Error("blocked_by_human_confirmation: caller round_kind conflicts with continuation flow");
      if (packet.baseline_packet_hash !== undefined && packet.baseline_packet_hash !== prior.baseline_packet_hash) throw new Error("blocked_by_human_confirmation: caller baseline_packet_hash conflicts with frozen baseline");
      packet.round_kind = "continuation"; packet.baseline_packet_hash = prior.baseline_packet_hash;
    } else {
      if (input.closure_evidence !== undefined || input.cross_stage_carryovers !== undefined) return this.#materialIncomplete(input, "closure_evidence and cross_stage_carryovers are continuation-only");
      if (packet.round_kind !== undefined && packet.round_kind !== "initial") return this.#materialIncomplete(input, "initial packet round_kind is invalid");
      if (packet.baseline_packet_hash !== undefined && packet.baseline_packet_hash !== null) return this.#materialIncomplete(input, "initial packet baseline_packet_hash must be null");
      packet.round_kind = "initial"; packet.baseline_packet_hash = null;
    }
    packet.packet_hash = /^[a-f0-9]{64}$/.test(packet.packet_hash ?? "") ? packet.packet_hash : "0".repeat(64);
    try { sealPacket(packet); verifyHostGitSource(packet, input.repository_root ?? input.repositoryRoot ?? input.changed_file_root ?? input.changedFileRoot ?? repositoryRoot); }
    catch (error) { return this.#materialIncomplete(input, error.message); }
    if (continuation && (prior.contract_hash !== packet.contract_hash || prior.skill_bundle_hash !== actualBundleHash || prior.frozen_bundle_hash !== actualBundleHash)) throw new Error("blocked_by_human_confirmation: frozen contract or skill bundle changed; use reset with human approval");
    const baselinePacketHash = continuation ? prior.baseline_packet_hash : packet.packet_hash;
    if (continuation) {
      const previousFindings = structuredClone(priorReceipt.merged_findings ?? []);
      const sourceRoot = input.repository_root ?? input.repositoryRoot ?? input.changed_file_root ?? input.changedFileRoot ?? repositoryRoot;
      const deltaSource = buildHostGitSource(sourceRoot, { base: priorPacket.source_revision.head, head: packet.source_revision.head });
      const closureCheck = exactClosureEvidence(previousFindings, input.closure_evidence, deltaSource, stageContract.hardIds);
      const closureEvidence = closureCheck.items;
      closureBundleGates = closureCheck.unverifiedBlockingIds;
      // Carryover state is host-owned and cumulative. Callers may only add or
      // supersede an id; omitting an open item must never erase it from the
      // next provider packet.
      const crossStageCarryovers = mergeCrossStageCarryovers(
        priorReceipt.delta?.cross_stage_carryovers ?? [],
        checkedCarryovers(input.cross_stage_carryovers, previousFindings),
      );
      delta = buildContinuationDelta({ previousPacket: priorPacket, currentPacket: packet, deltaSource, previousFindings, closureEvidence, crossStageCarryovers, requiredSkills: resolution.definitions });
      const prompt = continuationPrompt(delta, { stage: input.stage, reviewTrack }); const promptBytes = Buffer.byteLength(prompt, "utf8");
      if (promptBytes > this.continuationPromptMaxBytes) throw new Error(`CONTINUATION_PROMPT_TOO_LARGE: ${promptBytes} bytes exceeds host limit ${this.continuationPromptMaxBytes}`);
      Object.defineProperty(delta, "prompt", { value: prompt, enumerable: false });
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
      this.#recoverProjections(input.task_id, input.stage === "make-decision");
      const dir = this.#root(intent); atomic(join(dir, "review-packet.json"), safeJson(packet));
      const protocolPath = join(repositoryRoot, "skills", "wh-review", "contracts", "provider-protocol.md");
      const outputSchemaPath = join(repositoryRoot, "skills", "wh-review", "schemas", "reviewer-output.schema.json");
      const snapshotDir = join(dir, "frozen-inputs"); const frozenAttachments = [];
      const freeze = (destination, bytes) => { const target = join(snapshotDir, ...destination.split("/")); atomic(target, bytes); frozenAttachments.push({ destination, path: target, sha256: sha(bytes), size: Buffer.byteLength(bytes) }); };
      const initialPromptText = !continuation ? initialPrompt({ intent, packet, stageContract: stageContract.content, requiredSkills: resolution.definitions, deliveryMode: resolution.deliveryMode }) : null;
      if (initialPromptText && Buffer.byteLength(initialPromptText, "utf8") > this.initialPromptMaxBytes) throw new Error(`PROMPT_TOO_LARGE: ${Buffer.byteLength(initialPromptText, "utf8")} bytes exceeds host limit ${this.initialPromptMaxBytes}`);
      if (!continuation) {
        freeze("contracts/provider-protocol.md", readFileSync(protocolPath));
        freeze(`contracts/${input.stage}.md`, stageContract.content);
        freeze("schemas/reviewer-output.schema.json", readFileSync(outputSchemaPath));
        freeze("review-packet.v1.json", safeJson(packet));
        freeze("changes.diff", packet.unified_diff);
        for (const definition of resolution.definitions) for (const file of definition.bundle.files) freeze(`skills/${definition.name}/${file.path}`, file.content);
      }
      atomic(join(dir, "manifest.json"), safeJson({ packet_hash: packet.packet_hash, baseline_packet_hash: baselinePacketHash, manifest_hash: packet.manifest_hash, diff_sha256: packet.diff_sha256, changed_files: packet.changed_files, attachments: frozenAttachments.map(({ destination, sha256, size }) => ({ destination, sha256, size })), delta_manifest: continuation ? delta.delta_manifest : null }));
      const prepared = { intent, packet, input, lock, dir, resolution, capability_snapshot: capabilitySnapshot, initial_delivery_by_provider: prior?.initial_delivery_by_provider ?? null, frozen_bundle_hash: actualBundleHash, sealed_packet_hash: packet.packet_hash, frozen_snapshot_dir: snapshotDir, frozen_attachments: frozenAttachments, stage_contract_rules: { allIds: stageContract.allIds, hardIds: stageContract.hardIds }, closure_bundle_gates: closureBundleGates, delta, initial_prompt: initialPromptText };
      Object.defineProperty(prepared, "delivery_policy", { value: resolution.deliveryMode, enumerable: false, writable: false, configurable: false });
      return prepared;
    } catch (error) { this.#releaseLock(lock); throw error; }
  }

  async run(prepared) {
    prepared = await prepared;
    const { intent, packet, input } = prepared;
    let attachmentPlan = null;
    try {
      if (packet.packet_hash !== prepared.sealed_packet_hash || packetHash(packet) !== prepared.sealed_packet_hash || packet.stage !== intent.stage || packet.review_track !== intent.review_track) throw new Error("MATERIAL_INCOMPLETE: sealed review packet was modified after prepare");
      if (intent.initial_runtime_id && this.broker.status) {
        const state = await this.broker.status({ runtime_id: intent.initial_runtime_id });
        if (!state || (typeof state.expires_at_ms === "number" && state.expires_at_ms <= this.now())) throw new Error("blocked_by_human_confirmation: initial runtime expired; use reset with human approval");
      }
      const request = { version: 4, host_provider: input.host_provider, prompt: intent.round_kind === "continuation" ? prepared.delta.prompt : prepared.initial_prompt, continuation: intent.initial_runtime_id ? { runtime_id: intent.initial_runtime_id } : null, provider_allowlist: intent.candidate_providers };
      attachmentPlan = intent.initial_runtime_id ? null : this.#attachments(prepared);
      const attachments = attachmentPlan?.manifest;
      const response = intent.candidate_providers.length === 0
        ? { providers: [], transport_error: { code: "NO_CAPABLE_PROVIDER", message: "doctor reported no ready heterologous provider with a supported attachment delivery" } }
        : await this.broker.run(intent.round_kind === "continuation" ? { request } : { request, packet, attachments, attachmentDelivery: prepared.delivery_policy });
      atomic(join(prepared.dir, "broker-run.json"), safeJson(response));
      const candidateSet = new Set(intent.candidate_providers);
      const capabilityByProvider = new Map(prepared.capability_snapshot.providers.map((item) => [item.provider, item.capabilities]));
      const outcomes = (response.providers ?? []).map((item) => candidateSet.has(item?.provider)
        ? this.#outcome(item, packet, intent, input, prepared.dir, capabilityByProvider.get(item.provider), prepared.initial_delivery_by_provider?.[item.provider], prepared.delivery_policy, prepared.stage_contract_rules)
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
      const initialDeliveryByProvider = prepared.initial_delivery_by_provider ?? Object.fromEntries(intent.candidate_providers.map((provider) => [provider, outcomes.find((item) => item.provider === provider)?.delivery_used ?? null]));
      const receipt = { version: 1, intent: outcomeIntent, delta: prepared.delta, runtime_id: response.runtime_id ?? intent.initial_runtime_id, delivery_policy: prepared.delivery_policy, initial_delivery_by_provider: initialDeliveryByProvider, capability_snapshot: prepared.capability_snapshot, capability_snapshot_hash: intent.capability_snapshot_hash, candidate_providers: intent.candidate_providers, provider_outcomes: outcomes, merged_findings, hard_gates, human_gates, blocked_by_human_confirmation: blockedByHumanConfirmation, continuable_providers, continuation_eligible: eligible, created_at_ms: this.now() };
      const receiptPath = join(prepared.dir, "round-receipt.json"); atomic(receiptPath, safeJson(receipt));
      const result = { intent: outcomeIntent, round_kind: intent.round_kind, baseline_packet_hash: intent.baseline_packet_hash,
        previous_findings: prepared.delta?.previous_findings ?? [], closure_evidence: prepared.delta?.closure_evidence ?? [], delta_manifest: prepared.delta?.delta_manifest ?? null,
        affected_materials: prepared.delta?.affected_materials ?? {}, current_material_manifest: prepared.delta?.current_material_manifest ?? {},
        cross_stage_carryovers: prepared.delta?.cross_stage_carryovers ?? [], required_skill_lens_hashes: prepared.delta?.required_skill_lens_hashes ?? [],
        provider_outcomes: outcomes, merged_findings, hard_gates, human_gates, blocked_by_human_confirmation: blockedByHumanConfirmation, continuation_eligible: eligible, receipt_draft_ref: receiptPath };
      const priorFlow = this.#readFlow(intent);
      const packetRef = join(prepared.dir, "review-packet.json"); const packetFileHash = sha(readFileSync(packetRef));
      this.#writeFlow(intent, { ...(priorFlow ?? {}), ...outcomeIntent, initial_runtime_id: intent.initial_runtime_id ?? response.runtime_id ?? null, delivery_policy: prepared.delivery_policy, initial_delivery_by_provider: initialDeliveryByProvider, capability_snapshot_hash: intent.capability_snapshot_hash, candidate_providers: intent.candidate_providers, continuable_providers, continuation_eligible: eligible, business_round: aggregate.length ? intent.business_round : (priorFlow?.business_round ?? 0), packet_hash: packet.packet_hash, frozen_bundle_hash: prepared.frozen_bundle_hash,
        baseline_packet_ref: priorFlow?.baseline_packet_ref ?? packetRef, baseline_packet_file_sha256: priorFlow?.baseline_packet_file_sha256 ?? packetFileHash,
        previous_packet_ref: packetRef, previous_packet_file_sha256: packetFileHash, previous_receipt_ref: receiptPath, previous_receipt_sha256: sha(readFileSync(receiptPath)) });
      // A provider-originated escalation is already a semantic result. Publish
      // its redacted gate projection in this same run, instead of waiting for
      // a later prepare() recovery pass to revoke a stale public pass.
      if (human_gates.length) {
        let taskLock = null;
        try {
          if (intent.stage === "make-decision") taskLock = this.#taskProjectionLock(intent.task_id, `human-gate-${intent.review_flow_id}`);
          this.#writeHumanGateBlock(receipt, receiptPath, join(prepared.dir, "projection-manifest.json"), human_gates);
        } finally { if (taskLock) this.#releaseLock(taskLock); }
      }
      return validateSchema("round-run-result", result);
    } finally { this.#releaseLock(prepared.lock); if (attachmentPlan?.stagingDir) rmSync(attachmentPlan.stagingDir, { recursive: true, force: true }); }
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
  #recoverProjectionsUnderTaskLock(taskId) {
    const privateRoot = join(taskRoot(this.taskTrackingRoot, taskId), "reviews", "private"); if (!existsSync(privateRoot)) return;
    for (const name of readdirSync(privateRoot)) {
      if (!name.startsWith("round-")) continue; const dir = join(privateRoot, name), projection = join(dir, "projection-manifest.json"), receipt = join(dir, "round-receipt.json");
      if (!existsSync(receipt)) continue;
      const saved = JSON.parse(readFileSync(receipt, "utf8"));
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
      if (flags.core_receipt && flags.report && flags.report_index && flags.stage_result) continue;
      if (!Array.isArray(saved.dispositions)) continue;
      this.#publishUnderLock({ intent: saved.intent, provider_outcomes: saved.provider_outcomes, merged_findings: saved.merged_findings, hard_gates: saved.hard_gates, human_gates: saved.human_gates, blocked_by_human_confirmation: saved.blocked_by_human_confirmation, receipt_draft_ref: receipt }, { items: saved.dispositions });
    }
  }
  #writeHumanGateBlock(saved, receiptPath, projectionPath, human_gates) {
    // Receipt and flow are a single recovery unit. Never overwrite the
    // receipt directly here: a crash between receipt bytes and flow hash used
    // to leave an unrecoverable human gate.
    const flow = this.#readFlow(saved.intent);
    if (flow?.pending_receipt_update) this.#recoverPendingReceiptBinding(saved.intent, flow);
    const receipt = { ...saved, human_gates };
    this.#updateReceiptAndFlow(saved.intent, receiptPath, receipt);
    const dir = dirname(receiptPath); const { reportPath, indexPath, stageResultPath } = this.#publicPaths(saved.intent);
    const semantic_verdict = "escalate_to_human", needs_human = true;
    const core = projectPublicReviewCore({ version: 1, intent: saved.intent, semantic_verdict, needs_human, merged_findings: saved.merged_findings ?? [], hard_gates: saved.hard_gates ?? [], human_gates, provider_outcomes: saved.provider_outcomes ?? [] }, { sensitiveSource: saved });
    const corePath = join(dir, "core-receipt.json"); atomic(corePath, safeJson(core)); const coreHash = sha(readFileSync(corePath));
    atomic(reportPath, `# 审查报告\n\n结论：需要人工确认\n\n- Human gates：${core.human_gates.map(({ provider }) => provider).join(", ")}\n`, 0o644);
    atomic(indexPath, safeJson({ stage: saved.intent.stage, core_receipt_hash: coreHash, semantic_verdict, needs_human, report: relative(dirname(indexPath), reportPath), verdict: semantic_verdict, blocked_by_human_gate: true }), 0o644);
    atomic(stageResultPath, safeJson({ stage: saved.intent.stage, core_receipt_hash: coreHash, semantic_verdict, verdict: semantic_verdict, needs_human, blocked_by_human_gate: true, human_gate_providers: human_gates.map(({ provider }) => provider) }), 0o644);
    const publishedFlow = this.#readFlow(saved.intent);
    if (publishedFlow) this.#writeFlow(saved.intent, { ...publishedFlow, core_receipt_hash: coreHash, previous_receipt_sha256: sha(readFileSync(receiptPath)), published_at_ms: this.now() });
    if (saved.intent.stage === "make-decision") this.#publishMakeDecisionAggregate(saved.intent.task_id, saved.intent.review_flow_id);
    const projection = existsSync(projectionPath) ? JSON.parse(readFileSync(projectionPath, "utf8")) : { version: 1, done_flags: {} };
    projection.done_flags = { ...(projection.done_flags ?? {}), core_receipt: true, report: true, report_index: true, stage_result: true, human_gate_blocked: true };
    atomic(projectionPath, safeJson(projection));
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
  #materialIncomplete(input, message) {
    const root = join(taskRoot(this.taskTrackingRoot, input.task_id), "reviews", "private", "diagnostics");
    atomic(join(root, `material-incomplete-${this.now()}.json`), safeJson({ code: "MATERIAL_INCOMPLETE", message, stage: input.stage, review_track: input.review_track ?? null, review_flow_id: input.review_flow_id }));
    throw new Error(`MATERIAL_INCOMPLETE: ${message}`);
  }
  #attachments(prepared) {
    if (prepared.input.attachments) throw new Error("MATERIAL_INCOMPLETE: custom attachments cannot replace the sealed review packet bundle");
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
      atomic(target, bytes); entries.push({ source: rel(target), destination: frozen.destination, size: frozen.size, sha256: frozen.sha256, embed: true });
    }
    return { stagingDir, manifest: { version: 1, bundle_id: `wh-review-${prepared.intent.idempotency_key}`, entries } };
  }
  #outcome(item, packet, intent, input, directory, capabilities, initialDelivery, deliveryPolicy, contractRules) {
    const transport_status = classifyTransport(item); const delivery_used = item?.delivery_used ?? null;
    const rawHash = (value) => typeof value === "string" && /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase() : null;
    const base = { provider: item?.provider ?? null, transport_status, packet_status: "material_incomplete", semantic_verdict: null, business_valid: false, delivery_used, session_id: item?.session_id ?? null, raw_output_ref: item?.raw_output_ref ?? null, raw_stdout_sha256: rawHash(item?.raw_stdout_sha256), raw_stderr_sha256: rawHash(item?.raw_stderr_sha256) };
    if (typeof item?.output === "string" && item.provider) {
      const raw = join(directory, "providers", `${item.provider}.raw.txt`); atomic(raw, item.output); base.raw_output_ref = raw;
    }
    if (transport_status === "cancelled") {
      const cancel_source = item?.error?.source;
      if (!cancel_source) return { ...base, cancel_source: null, diagnostic: "CANCEL_SOURCE_MISSING" };
      if (!cancellationSources.has(cancel_source)) return { ...base, cancel_source: null, diagnostic: "CANCEL_SOURCE_INVALID" };
      return { ...base, cancel_source, diagnostic: publicError(item) };
    }
    if (item?.delivery_used === undefined || item.delivery_used === null) return { ...base, diagnostic: "DELIVERY_USED_MISSING" };
    if (item.delivery_used !== "file_only" && item.delivery_used !== "always_embed") return { ...base, diagnostic: "DELIVERY_USED_INVALID" };
    if (!capabilities?.attachment_delivery?.includes(item.delivery_used)) return { ...base, diagnostic: "DELIVERY_USED_CAPABILITY_MISMATCH" };
    if (intent.initial_runtime_id && item.delivery_used !== initialDelivery) return { ...base, diagnostic: "DELIVERY_USED_CONTINUATION_MISMATCH", requires_human_confirmation: true };
    if (item.delivery_used !== deliveryPolicy) return { ...base, diagnostic: "DELIVERY_USED_POLICY_MISMATCH" };
    if (transport_status !== "completed") return { ...base, diagnostic: publicError(item) };
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
    // Keep this boundary before reading result.intent: malformed public input
    // must fail as a schema error and must not touch any private receipt.
    validateSchema("dispositions", dispositions);
    validateSchema("round-run-result", result);
    const lock = this.#acquireLock({ ...result.intent, idempotency_key: sha(`publish\0${result.intent.task_id}\0${result.intent.stage}\0${result.intent.review_track ?? "default"}\0${result.intent.review_flow_id}\0${result.receipt_draft_ref}`) });
    let taskLock = null;
    try {
      if (result.intent.stage === "make-decision") taskLock = this.#taskProjectionLock(result.intent.task_id, `publish-${result.intent.review_flow_id}`);
      const trusted = this.#trustedResult(result);
      try {
        return this.#publishUnderLock(trusted, dispositions);
      } catch (error) {
        const dispositionFailure = /^(invalid disposition|hard invariant finding cannot be accepted|every finding requires exactly one disposition)$/.test(String(error?.message ?? ""));
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
  #latestPublishedMakeDecisionTrack(taskId, reviewFlowId, reviewTrack) {
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
    return { ...core, core_receipt_hash: flow.core_receipt_hash, review_flow_id: flow.review_flow_id };
  }
  #publishMakeDecisionAggregate(taskId, reviewFlowId) {
    assertSafeReviewFlowId(reviewFlowId);
    const direction = this.#latestPublishedMakeDecisionTrack(taskId, reviewFlowId, "direction");
    const detail = this.#latestPublishedMakeDecisionTrack(taskId, reviewFlowId, "detail");
    if (!direction || !detail) return null;
    const aggregate = aggregateMakeDecisionTracks({ direction, detail });
    if (!aggregate.semantic_verdict) throw new Error("make-decision aggregate requires semantic verdicts from both tracks");
    const reviews = join(taskRoot(this.taskTrackingRoot, taskId), "reviews");
    const aggregateCore = {
      version: 1, stage: "make-decision", review_flow_id: reviewFlowId, review_tracks: ["direction", "detail"],
      track_core_receipt_hashes: { direction: direction.core_receipt_hash, detail: detail.core_receipt_hash },
      track_review_flow_ids: { direction: direction.review_flow_id, detail: detail.review_flow_id },
      semantic_verdict: aggregate.semantic_verdict, needs_human: aggregate.needs_human, merged_findings: aggregate.findings,
    };
    const group = `make-decision-${reviewFlowId}`;
    const corePath = join(reviews, `${group}-aggregate-core-receipt.json`); atomic(corePath, safeJson(aggregateCore), 0o644); const coreHash = sha(readFileSync(corePath));
    const reportPath = join(reviews, `${group}-aggregate.md`); atomic(reportPath, `# Make Decision 汇总审查报告\n\n结论：${aggregate.semantic_verdict}\n\n- direction flow：${direction.review_flow_id}\n- detail flow：${detail.review_flow_id}\n- Findings：${aggregate.findings.length}\n`, 0o644);
    const indexPath = join(reviews, `report-index-${group}.json`); atomic(indexPath, safeJson({ stage: "make-decision", review_flow_id: reviewFlowId, review_tracks: ["direction", "detail"], core_receipt_hash: coreHash, semantic_verdict: aggregate.semantic_verdict, needs_human: aggregate.needs_human, report: relative(dirname(indexPath), reportPath) }), 0o644);
    const stageResultPath = join(reviews, `stage-result-${group}.json`); atomic(stageResultPath, safeJson({ stage: "make-decision", review_flow_id: reviewFlowId, review_tracks: ["direction", "detail"], core_receipt_hash: coreHash, verdict: aggregate.semantic_verdict, semantic_verdict: aggregate.semantic_verdict, needs_human: aggregate.needs_human }), 0o644);
    return { semantic_verdict: aggregate.semantic_verdict, core_receipt_hash: coreHash, needs_human: aggregate.needs_human, core_receipt_ref: corePath, report_ref: reportPath, report_index_ref: indexPath, stage_result_ref: stageResultPath };
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
    const privateReceipt = JSON.parse(readFileSync(result.receipt_draft_ref, "utf8")); privateReceipt.dispositions = dispositions.items; this.#updateReceiptAndFlow(result.intent, result.receipt_draft_ref, privateReceipt);
    const dir = dirname(result.receipt_draft_ref); const core = projectPublicReviewCore({ version: 1, intent: result.intent, semantic_verdict, needs_human, merged_findings: result.merged_findings, hard_gates: result.hard_gates, dispositions: dispositions.items, provider_outcomes: result.provider_outcomes }, { sensitiveSource: privateReceipt });
    const projection = join(dir, "projection-manifest.json"); const done = existsSync(projection) ? JSON.parse(readFileSync(projection, "utf8")) : { version: 1, done_flags: {} };
    const corePath = join(dir, "core-receipt.json"); atomic(corePath, safeJson(core)); done.done_flags.core_receipt = true; atomic(projection, safeJson(done)); const coreHash = sha(readFileSync(corePath));
    const report = `# 审查报告\n\n结论：${semantic_verdict === "revise_required" ? "需要修改" : "通过"}\n\n- 有效审查：${result.provider_outcomes.filter((item) => item.business_valid).length}\n- Findings：${result.merged_findings.length}\n`;
    const { reportPath, indexPath, stageResultPath } = this.#publicPaths(result.intent);
    atomic(reportPath, report, 0o644); done.done_flags.report = true; atomic(projection, safeJson(done));
    atomic(indexPath, safeJson({ stage: result.intent.stage, review_track: result.intent.review_track, core_receipt_hash: coreHash, semantic_verdict, needs_human, report: relative(dirname(indexPath), reportPath) }), 0o644); done.done_flags.report_index = true; atomic(projection, safeJson(done));
    atomic(stageResultPath, safeJson({ stage: result.intent.stage, review_track: result.intent.review_track, core_receipt_hash: coreHash, verdict: semantic_verdict, needs_human }), 0o644); done.done_flags.stage_result = true; atomic(projection, safeJson(done));
    const flow = this.#readFlow(result.intent); if (flow) this.#writeFlow(result.intent, { ...flow, core_receipt_hash: coreHash, previous_receipt_sha256: sha(readFileSync(result.receipt_draft_ref)), published_at_ms: this.now() });
    const aggregate = result.intent.stage === "make-decision" ? this.#publishMakeDecisionAggregate(result.intent.task_id, result.intent.review_flow_id) : null;
    return { semantic_verdict, core_receipt_hash: coreHash, needs_human, core_receipt_ref: corePath, report_ref: reportPath, report_index_ref: indexPath, stage_result_ref: stageResultPath, aggregate };
  }
  reset({ task_id, stage, review_track = null, review_flow_id, new_review_flow_id, reason, human_approval_ref }) {
    assertSafeTaskId(task_id); assertKnownStage(stage); assertReviewTrack(stage, review_track); assertSafeReviewFlowId(review_flow_id); if (!reason || !human_approval_ref) throw new Error("reset requires reason and human_approval_ref");
    const nextId = new_review_flow_id ?? `${review_flow_id}-reset-${this.now()}`; assertSafeReviewFlowId(nextId);
    const flow = { task_id, stage, review_track, review_flow_id: nextId, parent_review_flow_id: review_flow_id, reset_at_ms: this.now(), reason, human_approval_ref, initial_runtime_id: null, continuation_eligible: false, business_round: 0 };
    const lock = this.#acquireLock({ ...flow, idempotency_key: sha(`reset\0${task_id}\0${stage}\0${review_track ?? "default"}\0${review_flow_id}\0${nextId}\0${human_approval_ref}`) });
    try {
      const flowPath = this.#flow(flow), approvalPath = this.#resetApproval(flow);
      const approval = { version: 1, task_id, stage, review_track, review_flow_id: nextId, parent_review_flow_id: review_flow_id, human_approval_ref, reason, approved_at_ms: this.now() };
      if (existsSync(approvalPath)) {
        const savedApproval = JSON.parse(readFileSync(approvalPath, "utf8"));
        if (!(savedApproval?.version === 1 && savedApproval.task_id === task_id && savedApproval.stage === stage && (savedApproval.review_track ?? null) === review_track && savedApproval.review_flow_id === nextId && savedApproval.parent_review_flow_id === review_flow_id && savedApproval.human_approval_ref === human_approval_ref && savedApproval.reason === reason)) throw new Error("reset approval does not match requested reset");
      } else writeImmutable(approvalPath, approval);
      // Both records are create-exclusive. Until they exist, no old gate has a
      // supersession marker, so a partial reset remains blocked.
      writeImmutable(flowPath, flow);
      const privateRoot = join(taskRoot(this.taskTrackingRoot, task_id), "reviews", "private"); const approvalBytes = readFileSync(approvalPath);
      const superseded_receipt_refs = this.#markResetResolvedGates({ task_id, stage, review_track, review_flow_id, new_review_flow_id: nextId, reset_approval_ref: relative(privateRoot, approvalPath), reset_approval_sha256: sha(approvalBytes), reason, human_approval_ref });
      return { ...flow, reset_approval_ref: relative(privateRoot, approvalPath), superseded_receipt_refs };
    } finally { this.#releaseLock(lock); }
  }
}
