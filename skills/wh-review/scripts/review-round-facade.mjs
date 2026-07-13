import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { contractPathAndHash, assertKnownStage, assertSafeReviewFlowId, assertSafeTaskId, taskRoot } from "./lib/safe-id.mjs";
import { validateReviewerOutput } from "./reviewer-output-validator.mjs";
import { resolveRequiredSkills } from "./required-skill-resolver.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
const safeJson = (value) => JSON.stringify(value, null, 2) + "\n";
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const reviewPacketSchema = JSON.parse(readFileSync(new URL("../schemas/review-packet.schema.json", import.meta.url), "utf8"));
function atomic(path, value, mode = 0o600) { mkdirSync(dirname(path), { recursive: true, mode: 0o700 }); const temp = `${path}.${process.pid}.tmp`; writeFileSync(temp, value, { mode }); renameSync(temp, path); }
function stripFence(value) { const text = String(value ?? "").trim(); const found = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i); return found ? found[1] : text; }
function parseOutput(value) { try { return { ok: true, value: JSON.parse(stripFence(value)) }; } catch { return { ok: false }; } }
function packetHash(packet) { const input = { ...packet }; delete input.packet_hash; return sha(canonical(input)); }
function safeRelativePath(value) { return typeof value === "string" && value.length > 0 && !value.includes("\\") && !value.startsWith("/") && !value.split("/").some((part) => !part || part === "." || part === ".."); }
function manifestValue(packet) {
  const { packet_hash, manifest_hash, ...materials } = packet;
  return { diff_sha256: materials.diff_sha256, changed_files: materials.changed_files.map(({ path, old_path, status, sha256, size, old_sha256, old_size }) => ({ path, old_path: old_path ?? null, status, sha256: sha256 ?? null, size: size ?? null, old_sha256: old_sha256 ?? null, old_size: old_size ?? null })), raw_requirement: materials.raw_requirement, decision_log_excerpt: materials.decision_log_excerpt ?? null, acceptance_design_excerpt: materials.acceptance_design_excerpt ?? null, planning_artifacts: materials.planning_artifacts ?? [], verification_closure: materials.verification_closure ?? [], test_evidence: materials.test_evidence ?? [], host_verified_facts: materials.host_verified_facts, contract_hash: materials.contract_hash, skill_bundle_hash: materials.skill_bundle_hash, source_revision: materials.source_revision };
}
function packetComplete(packet) {
  if (!packet || typeof packet !== "object" || Array.isArray(packet)) return false;
  if (reviewPacketSchema.required.some((key) => !Object.hasOwn(packet, key))) return false;
  if (Object.keys(packet).some((key) => !Object.hasOwn(reviewPacketSchema.properties, key))) return false;
  if (packet.version !== "review-packet.v1" || !reviewPacketSchema.properties.stage.enum.includes(packet.stage)) return false;
  if (![null, "direction", "detail"].includes(packet.review_track)) return false;
  if (packet.stage === "make-decision" ? !["direction", "detail"].includes(packet.review_track) : packet.review_track !== null) return false;
  if (typeof packet.unified_diff !== "string" || !Array.isArray(packet.changed_files) || typeof packet.raw_requirement !== "string" || !Array.isArray(packet.host_verified_facts)) return false;
  if (!["packet_hash", "manifest_hash", "diff_sha256", "contract_hash", "skill_bundle_hash"].every((key) => typeof packet[key] === "string" && /^[a-f0-9]{64}$/.test(packet[key]))) return false;
  if (!packet.source_revision || typeof packet.source_revision !== "object" || Array.isArray(packet.source_revision) || typeof packet.source_revision.base !== "string" || !packet.source_revision.base || typeof packet.source_revision.head !== "string" || !packet.source_revision.head) return false;
  if (packet.stage === "make-decision" && packet.review_track === "direction" && ["decision_log_excerpt", "acceptance_design_excerpt", "planning_artifacts", "verification_closure", "test_evidence"].some((key) => Object.hasOwn(packet, key))) return false;
  if (packet.stage === "make-decision" && packet.review_track === "detail" && (typeof packet.decision_log_excerpt !== "string" || typeof packet.acceptance_design_excerpt !== "string")) return false;
  if (packet.stage === "build-spec" && (typeof packet.acceptance_design_excerpt !== "string" || !Array.isArray(packet.planning_artifacts))) return false;
  if (packet.stage === "build-plan" && !Array.isArray(packet.planning_artifacts)) return false;
  if (packet.stage === "build-code" && (typeof packet.acceptance_design_excerpt !== "string" || !Array.isArray(packet.test_evidence))) return false;
  if (packet.stage === "verify-code" && (typeof packet.acceptance_design_excerpt !== "string" || !Array.isArray(packet.verification_closure) || !Array.isArray(packet.test_evidence))) return false;
  return true;
}
function sealPacket(packet) {
  if (!packetComplete(packet)) throw new Error("review-packet.v1 is incomplete");
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
  if (packet.unified_diff !== built.unified_diff || canonical(packet.changed_files) !== canonical(built.changed_files)) throw new Error("review packet source evidence does not match host git base/head revisions");
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
function findingId(finding) { return sha(`${finding.file}\0${finding.line}\0${finding.rule_id}\0${finding.issue.trim().toLowerCase()}`); }
function redact(value) { return JSON.parse(JSON.stringify(value, (key, field) => /runtime_id|session_id|raw_output|diagnostic|workspace|absolute_path/i.test(key) ? undefined : field)); }

export class ReviewRoundFacade {
  constructor({ taskTrackingRoot, broker, skillsRoot, now = () => Date.now() } = {}) {
    if (!taskTrackingRoot) throw new TypeError("taskTrackingRoot is required"); if (!broker?.run) throw new TypeError("broker.run is required");
    this.taskTrackingRoot = resolve(taskTrackingRoot); this.broker = broker; this.skillsRoot = resolve(skillsRoot ?? repositoryRoot); this.now = now;
  }
  #root(intent) { return join(taskRoot(this.taskTrackingRoot, intent.task_id), "reviews", "private", `round-${intent.stage}-${intent.review_flow_id}-${intent.business_round}`); }
  #flow(intent) { return join(taskRoot(this.taskTrackingRoot, intent.task_id), "reviews", "private", "flows", `${intent.stage}-${intent.review_flow_id}.json`); }
  #lock(intent) { return join(taskRoot(this.taskTrackingRoot, intent.task_id), "reviews", "private", "flows", `${intent.task_id}.lock`); }
  #readFlow(intent) { const path = this.#flow(intent); return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null; }
  #writeFlow(intent, value) { atomic(this.#flow(intent), safeJson(value)); }

  prepare(input) {
    assertSafeTaskId(input.task_id); assertKnownStage(input.stage); assertSafeReviewFlowId(input.review_flow_id);
    if (input.source_snapshot !== undefined || input.sourceSnapshot !== undefined) throw new Error("source_snapshot is not accepted; wh-review builds source evidence from host git revisions");
    const prior = this.#readFlow(input); const continuation = input.continuation === true;
    const continuableProviders = this.#continuableProviders(input);
    if (continuation && JSON.stringify(continuableProviders) !== JSON.stringify(prior?.continuable_providers ?? [])) throw new Error("blocked_by_human_confirmation: provider continuation capability set changed; use reset with human approval");
    if (continuation && (!prior?.initial_runtime_id || !prior.continuation_eligible)) throw new Error("blocked_by_human_confirmation: flow cannot continue; use reset with human approval");
    if (!continuation && prior?.initial_runtime_id) throw new Error("blocked_by_human_confirmation: an initial runtime already exists; use reset with human approval");
    const packet = structuredClone(input.packet);
    const reviewTrack = input.review_track ?? null;
    if (packet?.stage !== input.stage || packet?.review_track !== reviewTrack) return this.#materialIncomplete(input, "packet stage or review_track does not match review intent");
    const { contractHash } = contractPathAndHash(input.stage);
    if (packet.contract_hash !== contractHash && !input.allow_contract_hash_override) return this.#materialIncomplete(input, "contract hash mismatch");
    const resolution = resolveRequiredSkills({ stage: input.stage, reviewTrack, ui: Boolean(input.ui) });
    const actualBundleHash = bundleHash(resolution);
    if (packet.skill_bundle_hash !== actualBundleHash) return this.#materialIncomplete(input, "skill bundle hash mismatch");
    packet.packet_hash = /^[a-f0-9]{64}$/.test(packet.packet_hash ?? "") ? packet.packet_hash : "0".repeat(64);
    try { sealPacket(packet); verifyHostGitSource(packet, input.repository_root ?? input.repositoryRoot ?? input.changed_file_root ?? input.changedFileRoot ?? repositoryRoot); }
    catch (error) { return this.#materialIncomplete(input, error.message); }
    if (continuation && (prior.contract_hash !== packet.contract_hash || prior.skill_bundle_hash !== actualBundleHash || prior.frozen_bundle_hash !== actualBundleHash)) throw new Error("blocked_by_human_confirmation: frozen contract or skill bundle changed; use reset with human approval");
    const intent = { task_id: input.task_id, stage: input.stage, review_track: input.review_track ?? null, review_flow_id: input.review_flow_id,
      business_round: (prior?.business_round ?? 0) + 1, contract_hash: packet.contract_hash, material_manifest_hash: packet.manifest_hash, skill_bundle_hash: packet.skill_bundle_hash,
      initial_runtime_id: continuation ? prior.initial_runtime_id : null, previous_core_receipt_hash: prior?.core_receipt_hash ?? null,
      idempotency_key: sha(`${input.task_id}\0${input.stage}\0${input.review_flow_id}\0${packet.packet_hash}\0${prior?.initial_runtime_id ?? "initial"}`) };
    const lock = this.#acquireLock(intent);
    try {
      this.#recoverProjections(input.task_id);
      const dir = this.#root(intent); atomic(join(dir, "review-packet.json"), safeJson(packet));
      atomic(join(dir, "manifest.json"), safeJson({ packet_hash: packet.packet_hash, manifest_hash: packet.manifest_hash, diff_sha256: packet.diff_sha256, changed_files: packet.changed_files }));
      const { contractPath } = contractPathAndHash(input.stage); const protocolPath = join(repositoryRoot, "skills", "wh-review", "contracts", "provider-protocol.md");
      const snapshotDir = join(dir, "frozen-inputs"); const frozenAttachments = [];
      const freeze = (destination, bytes) => { const target = join(snapshotDir, ...destination.split("/")); atomic(target, bytes); frozenAttachments.push({ destination, path: target, sha256: sha(bytes), size: Buffer.byteLength(bytes) }); };
      freeze("review-packet.v1.json", safeJson(packet)); freeze("contracts/provider-protocol.md", readFileSync(protocolPath)); freeze(`contracts/${input.stage}.md`, readFileSync(contractPath));
      for (const definition of resolution.definitions) for (const file of definition.bundle.files) freeze(`skills/${definition.name}/${file.path}`, file.content);
      return { intent, packet, input, lock, dir, resolution, frozen_bundle_hash: actualBundleHash, sealed_packet_hash: packet.packet_hash, frozen_snapshot_dir: snapshotDir, frozen_attachments: frozenAttachments };
    } catch (error) { this.#releaseLock(lock); throw error; }
  }

  async run(prepared) {
    const { intent, packet, input } = prepared;
    let attachmentPlan = null;
    try {
      if (packet.packet_hash !== prepared.sealed_packet_hash || packetHash(packet) !== prepared.sealed_packet_hash || packet.stage !== intent.stage || packet.review_track !== intent.review_track) throw new Error("MATERIAL_INCOMPLETE: sealed review packet was modified after prepare");
      if (intent.initial_runtime_id && this.broker.status) {
        const state = await this.broker.status({ runtime_id: intent.initial_runtime_id });
        if (!state || (typeof state.expires_at_ms === "number" && state.expires_at_ms <= this.now())) throw new Error("blocked_by_human_confirmation: initial runtime expired; use reset with human approval");
      }
      const request = { version: 4, host_provider: input.host_provider, prompt: this.#prompt(intent, packet, input), continuation: intent.initial_runtime_id ? { runtime_id: intent.initial_runtime_id } : null };
      attachmentPlan = intent.initial_runtime_id ? null : this.#attachments(prepared);
      const attachments = attachmentPlan?.manifest;
      const response = await this.broker.run({ request, packet, attachments, attachmentDelivery: input.attachment_delivery ?? "file_only" });
      atomic(join(prepared.dir, "broker-run.json"), safeJson(response));
      const outcomes = (response.providers ?? []).map((item) => this.#outcome(item, packet, intent, input, prepared.dir));
      if (response.transport_error) outcomes.push({ provider: null, transport_status: "failed", packet_status: "material_incomplete", semantic_verdict: null, business_valid: false, diagnostic: response.transport_error.code });
      const continuable_providers = this.#continuableProviders(input);
      const eligible = continuable_providers.length > 0 && continuable_providers.every((provider) => outcomes.some((item) => item.provider === provider && item.transport_status === "completed" && item.packet_status === "complete" && item.business_valid && item.session_id));
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
      const merged_findings = [...unique.values()]; const hard_gates = merged_findings.filter((finding) => finding.severity === "blocking" || finding.rule_id.startsWith("hard"));
      // An escalation is a business-valid result, not an empty pass. Keep its
      // provider provenance independent from findings so a finding-free
      // escalation cannot disappear during merge or publication.
      const human_gates = deriveHumanGates(outcomes);
      const receipt = { version: 1, intent, runtime_id: response.runtime_id ?? intent.initial_runtime_id, provider_outcomes: outcomes, merged_findings, hard_gates, human_gates, continuable_providers, continuation_eligible: eligible, created_at_ms: this.now() };
      const receiptPath = join(prepared.dir, "round-receipt.json"); atomic(receiptPath, safeJson(receipt));
      const result = { intent, provider_outcomes: outcomes, merged_findings, hard_gates, human_gates, continuation_eligible: eligible, receipt_draft_ref: receiptPath };
      this.#writeFlow(intent, { ...intent, initial_runtime_id: intent.initial_runtime_id ?? response.runtime_id ?? null, continuable_providers, continuation_eligible: eligible, business_round: aggregate.length ? intent.business_round : (this.#readFlow(intent)?.business_round ?? 0), packet_hash: packet.packet_hash, frozen_bundle_hash: prepared.frozen_bundle_hash });
      return result;
    } finally { this.#releaseLock(prepared.lock); if (attachmentPlan?.stagingDir) rmSync(attachmentPlan.stagingDir, { recursive: true, force: true }); }
  }

  #prompt(intent, packet) {
    return `You are an independent read-only reviewer. Review only review-packet.v1.json in your private workspace. Do not access a repository, run git, request absolute paths, or infer missing material. Return only reviewer-output JSON.\npacket_hash=${packet.packet_hash}\ndiff_sha256=${packet.diff_sha256}\ncontract_hash=${intent.contract_hash}\nskill_bundle_hash=${intent.skill_bundle_hash}`;
  }
  #continuableProviders(input) {
    const capabilities = input.provider_capabilities;
    if (!capabilities || typeof capabilities !== "object") throw new Error("blocked_by_human_confirmation: provider_capabilities are required to establish continuation");
    return Object.entries(capabilities).filter(([, value]) => value?.continuation === true).map(([provider]) => provider).sort();
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
        let active = true; try { process.kill(owner.pid, 0); } catch (cause) { active = cause?.code !== "ESRCH"; }
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
    atomic(join(lock, "owner.json"), safeJson({ pid: process.pid, created_at_ms: this.now(), idempotency_key: intent.idempotency_key }));
    return lock;
  }
  #releaseLock(lock) { rmSync(lock, { recursive: true, force: true }); }
  #recoverProjections(taskId) {
    const privateRoot = join(taskRoot(this.taskTrackingRoot, taskId), "reviews", "private"); if (!existsSync(privateRoot)) return;
    for (const name of readdirSync(privateRoot)) {
      if (!name.startsWith("round-")) continue; const dir = join(privateRoot, name), projection = join(dir, "projection-manifest.json"), receipt = join(dir, "round-receipt.json");
      if (!existsSync(receipt)) continue;
      const flags = existsSync(projection) ? (JSON.parse(readFileSync(projection, "utf8")).done_flags ?? {}) : {};
      if (flags.core_receipt && flags.report && flags.report_index && flags.stage_result) continue;
      const saved = JSON.parse(readFileSync(receipt, "utf8")); if (!Array.isArray(saved.dispositions)) continue;
      this.publish({ intent: saved.intent, provider_outcomes: saved.provider_outcomes, merged_findings: saved.merged_findings, hard_gates: saved.hard_gates, human_gates: saved.human_gates, receipt_draft_ref: receipt }, { items: saved.dispositions });
    }
  }
  #materialIncomplete(input, message) {
    const root = join(taskRoot(this.taskTrackingRoot, input.task_id), "reviews", "private", "diagnostics");
    atomic(join(root, `material-incomplete-${this.now()}.json`), safeJson({ code: "MATERIAL_INCOMPLETE", message, stage: input.stage, review_flow_id: input.review_flow_id }));
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
  #outcome(item, packet, intent, input, directory) {
    const transport_status = classifyTransport(item); const base = { provider: item?.provider ?? null, transport_status, packet_status: "material_incomplete", semantic_verdict: null, business_valid: false, session_id: item?.session_id ?? null, raw_output_ref: item?.raw_output_ref ?? null };
    if (typeof item?.output === "string" && item.provider) {
      const raw = join(directory, "providers", `${item.provider}.raw.txt`); atomic(raw, item.output); base.raw_output_ref = raw;
    }
    if (transport_status === "cancelled") {
      const cancel_source = item?.error?.source;
      return { ...base, cancel_source: cancel_source ?? null, diagnostic: cancel_source ? publicError(item) : "CANCEL_SOURCE_MISSING" };
    }
    if (transport_status !== "completed") return { ...base, diagnostic: publicError(item) };
    const parsed = parseOutput(item.output); if (!parsed.ok) return { ...base, packet_status: "material_incomplete", diagnostic: "NON_JSON_OUTPUT" };
    const output = parsed.value;
    if (output.packet_hash !== packet.packet_hash || output.manifest_hash !== packet.manifest_hash || output.diff_sha256 !== packet.diff_sha256 || output.contract_hash !== intent.contract_hash || output.skill_bundle_hash !== intent.skill_bundle_hash) return { ...base, packet_status: "hash_mismatch", diagnostic: "PACKET_HASH_MISMATCH" };
    if (output.packet_status !== "complete") return { ...base, packet_status: output.packet_status ?? "material_incomplete", diagnostic: "PROVIDER_PACKET_INCOMPLETE" };
    const checked = validateReviewerOutput({ stage: intent.stage, reviewTrack: intent.review_track, ui: Boolean(input.ui), output });
    if (!checked.valid) return { ...base, packet_status: "complete", diagnostic: checked.errors.join("; ") };
    const findings = output.findings.map((finding) => ({ ...finding, finding_id: findingId(finding), providers: [item.provider] }));
    return { ...base, packet_status: "complete", semantic_verdict: output.verdict, business_valid: true, findings, summary: output.summary, checklist: output.checklist };
  }

  publish(result, dispositions) {
    if (!Array.isArray(dispositions?.items)) throw new TypeError("dispositions.items is required");
    if (!result.provider_outcomes.some((item) => item.business_valid && item.semantic_verdict)) throw new Error("no business-valid provider outcome to publish");
    const human_gates = deriveHumanGates(result.provider_outcomes);
    if (result.human_gates !== undefined && canonical(result.human_gates) !== canonical(human_gates)) throw new Error("human gate provenance does not match provider outcomes");
    if (human_gates.length) throw new Error("human gate requires explicit human confirmation before publication");
    const byId = new Map(result.merged_findings.map((item) => [item.finding_id, item])); const seen = new Set();
    for (const item of dispositions.items) { const finding = byId.get(item.finding_id); if (!finding || seen.has(item.finding_id) || !["accept", "reject", "defer"].includes(item.action) || !item.evidence) throw new Error("invalid disposition"); seen.add(item.finding_id); if ((finding.severity === "blocking" || finding.rule_id.startsWith("hard")) && item.action === "accept") throw new Error("hard invariant finding cannot be accepted"); }
    if (seen.size !== byId.size) throw new Error("every finding requires exactly one disposition");
    const privateReceipt = JSON.parse(readFileSync(result.receipt_draft_ref, "utf8")); privateReceipt.dispositions = dispositions.items; atomic(result.receipt_draft_ref, safeJson(privateReceipt));
    const dir = dirname(result.receipt_draft_ref); const core = redact({ version: 1, intent: result.intent, merged_findings: result.merged_findings, hard_gates: result.hard_gates, dispositions: dispositions.items, provider_outcomes: result.provider_outcomes });
    const projection = join(dir, "projection-manifest.json"); const done = existsSync(projection) ? JSON.parse(readFileSync(projection, "utf8")) : { version: 1, done_flags: {} };
    const corePath = join(dir, "core-receipt.json"); atomic(corePath, safeJson(core)); done.done_flags.core_receipt = true; atomic(projection, safeJson(done)); const coreHash = sha(readFileSync(corePath));
    const report = `# 审查报告\n\n结论：${result.hard_gates.length ? "需要修改" : "通过"}\n\n- 有效审查：${result.provider_outcomes.filter((item) => item.business_valid).length}\n- Findings：${result.merged_findings.length}\n`;
    const reportPath = join(taskRoot(this.taskTrackingRoot, result.intent.task_id), "reviews", `${result.intent.stage}-${result.intent.review_flow_id}.md`); atomic(reportPath, report, 0o644); done.done_flags.report = true; atomic(projection, safeJson(done));
    const indexPath = join(taskRoot(this.taskTrackingRoot, result.intent.task_id), "reviews", "report-index.json"); atomic(indexPath, safeJson({ stage: result.intent.stage, core_receipt_hash: coreHash, report: relative(dirname(indexPath), reportPath) }), 0o644); done.done_flags.report_index = true; atomic(projection, safeJson(done));
    const stageResultPath = join(taskRoot(this.taskTrackingRoot, result.intent.task_id), "reviews", `stage-result-${result.intent.stage}.json`); atomic(stageResultPath, safeJson({ stage: result.intent.stage, core_receipt_hash: coreHash, verdict: result.hard_gates.length ? "revise_required" : "pass" }), 0o644); done.done_flags.stage_result = true; atomic(projection, safeJson(done));
    const flow = this.#readFlow(result.intent); if (flow) this.#writeFlow(result.intent, { ...flow, core_receipt_hash: coreHash });
    return { core_receipt_ref: corePath, report_ref: reportPath, report_index_ref: indexPath, stage_result_ref: stageResultPath };
  }
  reset({ task_id, stage, review_flow_id, new_review_flow_id, reason, human_approval_ref }) {
    assertSafeTaskId(task_id); assertKnownStage(stage); assertSafeReviewFlowId(review_flow_id); if (!reason || !human_approval_ref) throw new Error("reset requires reason and human_approval_ref");
    const nextId = new_review_flow_id ?? `${review_flow_id}-reset-${this.now()}`; assertSafeReviewFlowId(nextId);
    const flow = { task_id, stage, review_flow_id: nextId, parent_review_flow_id: review_flow_id, reset_at_ms: this.now(), reason, human_approval_ref, initial_runtime_id: null, continuation_eligible: false, business_round: 0 }; this.#writeFlow(flow, flow); return flow;
  }
}
