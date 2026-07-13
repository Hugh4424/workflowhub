import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
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
function atomic(path, value, mode = 0o600) { mkdirSync(dirname(path), { recursive: true, mode: 0o700 }); const temp = `${path}.${process.pid}.tmp`; writeFileSync(temp, value, { mode }); renameSync(temp, path); }
function stripFence(value) { const text = String(value ?? "").trim(); const found = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i); return found ? found[1] : text; }
function parseOutput(value) { try { return { ok: true, value: JSON.parse(stripFence(value)) }; } catch { return { ok: false }; } }
function packetHash(packet) { const input = { ...packet }; delete input.packet_hash; return sha(canonical(input)); }
function safeRelativePath(value) { return typeof value === "string" && value.length > 0 && !value.includes("\\") && !value.startsWith("/") && !value.split("/").some((part) => !part || part === "." || part === ".."); }
function manifestValue(packet) {
  const { packet_hash, manifest_hash, ...materials } = packet;
  return { diff_sha256: materials.diff_sha256, changed_files: materials.changed_files.map(({ path, sha256, size }) => ({ path, sha256, size })), raw_requirement: materials.raw_requirement, decision_log_excerpt: materials.decision_log_excerpt ?? null, acceptance_design_excerpt: materials.acceptance_design_excerpt ?? null, planning_artifacts: materials.planning_artifacts ?? [], verification_closure: materials.verification_closure ?? [], test_evidence: materials.test_evidence ?? [], host_verified_facts: materials.host_verified_facts, contract_hash: materials.contract_hash, skill_bundle_hash: materials.skill_bundle_hash };
}
function packetComplete(packet) {
  return packet && packet.version === "review-packet.v1" && typeof packet.unified_diff === "string" && Array.isArray(packet.changed_files) &&
    typeof packet.raw_requirement === "string" && Array.isArray(packet.host_verified_facts) && /^[a-f0-9]{64}$/.test(packet.manifest_hash ?? "") && /^[a-f0-9]{64}$/.test(packet.diff_sha256 ?? "");
}
function sealPacket(packet, changedFileRoot) {
  if (!packetComplete(packet)) throw new Error("review-packet.v1 is incomplete");
  const diff = sha(packet.unified_diff);
  if (packet.diff_sha256 && packet.diff_sha256 !== diff) throw new Error("diff_sha256 mismatch");
  packet.diff_sha256 = diff;
  for (const entry of packet.changed_files) {
    if (!entry || !safeRelativePath(entry.path) || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "") || !Number.isSafeInteger(entry.size) || entry.size < 0) throw new Error("invalid changed_files entry");
    if (changedFileRoot) {
      const target = resolve(changedFileRoot, entry.path); const root = resolve(changedFileRoot);
      if (target !== root && !target.startsWith(`${root}/`)) throw new Error("changed file escapes root");
      const stat = lstatSync(target); if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("changed file is not a regular file");
      const bytes = readFileSync(target); if (entry.size !== bytes.length || entry.sha256 !== sha(bytes)) throw new Error("changed file hash or size mismatch");
    }
  }
  const manifest = sha(canonical(manifestValue(packet)));
  if (packet.manifest_hash && packet.manifest_hash !== manifest) throw new Error("manifest_hash mismatch");
  packet.manifest_hash = manifest;
  packet.packet_hash = packetHash(packet);
  return packet;
}
function publicError(item) { return item?.error?.code ?? item?.error?.message ?? "PROVIDER_FAILED"; }
function classifyTransport(item) {
  if (item?.status === "cancelled") return "cancelled";
  const code = publicError(item);
  if (/AUTH/i.test(code)) return "authentication_failed";
  if (/TIMEOUT/i.test(code)) return "timeout";
  return item?.status === "completed" ? "completed" : "failed";
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
    const prior = this.#readFlow(input); const continuation = input.continuation === true;
    const continuableProviders = this.#continuableProviders(input);
    if (continuation && JSON.stringify(continuableProviders) !== JSON.stringify(prior?.continuable_providers ?? [])) throw new Error("blocked_by_human_confirmation: provider continuation capability set changed; use reset with human approval");
    if (continuation && (!prior?.initial_runtime_id || !prior.continuation_eligible)) throw new Error("blocked_by_human_confirmation: flow cannot continue; use reset with human approval");
    if (!continuation && prior?.initial_runtime_id) throw new Error("blocked_by_human_confirmation: an initial runtime already exists; use reset with human approval");
    const packet = structuredClone(input.packet);
    try { sealPacket(packet, input.changed_file_root ?? repositoryRoot); }
    catch (error) { return this.#materialIncomplete(input, error.message); }
    packet.stage = input.stage; packet.review_track = input.review_track ?? null;
    const { contractHash } = contractPathAndHash(input.stage);
    if (packet.contract_hash !== contractHash && !input.allow_contract_hash_override) return this.#materialIncomplete(input, "contract hash mismatch");
    const intent = { task_id: input.task_id, stage: input.stage, review_track: input.review_track ?? null, review_flow_id: input.review_flow_id,
      business_round: (prior?.business_round ?? 0) + 1, contract_hash: packet.contract_hash, material_manifest_hash: packet.manifest_hash, skill_bundle_hash: packet.skill_bundle_hash,
      initial_runtime_id: continuation ? prior.initial_runtime_id : null, previous_core_receipt_hash: prior?.core_receipt_hash ?? null,
      idempotency_key: sha(`${input.task_id}\0${input.stage}\0${input.review_flow_id}\0${packet.packet_hash}\0${prior?.initial_runtime_id ?? "initial"}`) };
    const lock = this.#lock(intent); mkdirSync(dirname(lock), { recursive: true, mode: 0o700 });
    try { mkdirSync(lock, { mode: 0o700 }); } catch { throw new Error("review-already-running"); }
    this.#recoverProjections(input.task_id);
    const dir = this.#root(intent); atomic(join(dir, "review-packet.json"), safeJson(packet));
    atomic(join(dir, "manifest.json"), safeJson({ packet_hash: packet.packet_hash, manifest_hash: packet.manifest_hash, diff_sha256: packet.diff_sha256, changed_files: packet.changed_files }));
    return { intent, packet, input, lock, dir };
  }

  async run(prepared) {
    const { intent, packet, input } = prepared;
    let attachmentPlan = null;
    try {
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
      const unique = new Map(); for (const item of aggregate) for (const finding of item.findings) unique.set(finding.finding_id, finding);
      const merged_findings = [...unique.values()]; const hard_gates = merged_findings.filter((finding) => finding.severity === "blocking" || finding.rule_id.startsWith("hard"));
      const receipt = { version: 1, intent, runtime_id: response.runtime_id ?? intent.initial_runtime_id, provider_outcomes: outcomes, merged_findings, hard_gates, continuable_providers, continuation_eligible: eligible, created_at_ms: this.now() };
      const receiptPath = join(prepared.dir, "round-receipt.json"); atomic(receiptPath, safeJson(receipt));
      const result = { intent, provider_outcomes: outcomes, merged_findings, hard_gates, continuation_eligible: eligible, receipt_draft_ref: receiptPath };
      this.#writeFlow(intent, { ...intent, initial_runtime_id: intent.initial_runtime_id ?? response.runtime_id ?? null, continuable_providers, continuation_eligible: eligible, business_round: aggregate.length ? intent.business_round : (this.#readFlow(intent)?.business_round ?? 0), packet_hash: packet.packet_hash });
      return result;
    } finally { rmSync(prepared.lock, { recursive: true, force: true }); if (attachmentPlan?.stagedPacket) rmSync(attachmentPlan.stagedPacket, { force: true }); }
  }

  #prompt(intent, packet) {
    return `You are an independent read-only reviewer. Review only review-packet.v1.json in your private workspace. Do not access a repository, run git, request absolute paths, or infer missing material. Return only reviewer-output JSON.\npacket_hash=${packet.packet_hash}\ndiff_sha256=${packet.diff_sha256}\ncontract_hash=${intent.contract_hash}\nskill_bundle_hash=${intent.skill_bundle_hash}`;
  }
  #continuableProviders(input) {
    const capabilities = input.provider_capabilities;
    if (!capabilities || typeof capabilities !== "object") throw new Error("blocked_by_human_confirmation: provider_capabilities are required to establish continuation");
    return Object.entries(capabilities).filter(([, value]) => value?.continuation === true).map(([provider]) => provider).sort();
  }
  #recoverProjections(taskId) {
    const privateRoot = join(taskRoot(this.taskTrackingRoot, taskId), "reviews", "private"); if (!existsSync(privateRoot)) return;
    for (const name of readdirSync(privateRoot)) {
      if (!name.startsWith("round-")) continue; const dir = join(privateRoot, name), projection = join(dir, "projection-manifest.json"), receipt = join(dir, "round-receipt.json");
      if (!existsSync(projection) || !existsSync(receipt)) continue;
      const flags = JSON.parse(readFileSync(projection, "utf8")).done_flags ?? {}; if (flags.core_receipt && flags.report && flags.report_index && flags.stage_result) continue;
      const saved = JSON.parse(readFileSync(receipt, "utf8")); if (!Array.isArray(saved.dispositions)) continue;
      this.publish({ intent: saved.intent, provider_outcomes: saved.provider_outcomes, merged_findings: saved.merged_findings, hard_gates: saved.hard_gates, receipt_draft_ref: receipt }, { items: saved.dispositions });
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
    // The broker only copies files below one configured attachment root. Stage
    // the packet under that root, then delete it after broker.run has returned.
    const stagedPacket = join(root, ".wh-review-packets", `${prepared.intent.idempotency_key}.json`);
    atomic(stagedPacket, safeJson(prepared.packet));
    const add = (sourcePath, destination, embed = true) => { const bytes = readFileSync(sourcePath); return { source: rel(sourcePath), destination, size: bytes.length, sha256: sha(bytes), embed }; };
    const { contractPath } = contractPathAndHash(prepared.intent.stage);
    const protocol = join(repositoryRoot, "skills", "wh-review", "contracts", "provider-protocol.md");
    const resolution = resolveRequiredSkills({ stage: prepared.intent.stage, reviewTrack: prepared.intent.review_track, ui: Boolean(prepared.input.ui) });
    const entries = [add(stagedPacket, "review-packet.v1.json"), add(protocol, "contracts/provider-protocol.md"), add(contractPath, `contracts/${prepared.intent.stage}.md`)];
    for (const definition of resolution.definitions) for (const file of definition.bundle.files) entries.push(add(join(repositoryRoot, "skills", definition.name, file.path), `skills/${definition.name}/${file.path}`));
    return { stagedPacket, manifest: { version: 1, bundle_id: `wh-review-${prepared.intent.idempotency_key}`, entries } };
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
