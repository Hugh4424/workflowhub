import { createHash } from "node:crypto";

const sha = (value) => createHash("sha256").update(value).digest("hex");
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
const materialKeys = ["raw_requirement", "acceptance_design_excerpt", "decision_log_excerpt", "planning_artifacts", "verification_closure", "test_evidence", "host_verified_facts"];
function fingerprint(value) {
  const bytes = typeof value === "string" ? value : canonical(value ?? null);
  return { sha256: sha(bytes), size: Buffer.byteLength(bytes) };
}
export function currentMaterialManifest(packet) {
  return Object.fromEntries(materialKeys.filter((key) => Object.hasOwn(packet, key)).map((key) => [key, fingerprint(packet[key])]));
}
export function buildContinuationDelta({ previousPacket, currentPacket, deltaSource, previousFindings, closureEvidence, crossStageCarryovers, requiredSkills }) {
  const previousManifest = currentMaterialManifest(previousPacket); const currentManifest = currentMaterialManifest(currentPacket);
  const changedMaterials = materialKeys.filter((key) => canonical(previousPacket[key] ?? null) !== canonical(currentPacket[key] ?? null));
  const affectedMaterials = Object.fromEntries(changedMaterials.map((key) => [key, currentPacket[key]]));
  if (deltaSource.unified_diff) affectedMaterials.changes_diff = { attachment: "changes.diff", sha256: sha(deltaSource.unified_diff), size: Buffer.byteLength(deltaSource.unified_diff) };
  const deltaManifest = {
    baseline_packet_hash: currentPacket.baseline_packet_hash,
    previous_packet_hash: previousPacket.packet_hash,
    // continuation-delta.v1.json is itself provider-visible material. A
    // final current packet hash would therefore create a circular binding:
    // packet -> material manifest -> delta -> packet. The final packet and
    // inner attachment manifest bind each other; this delta records the
    // stable source-material binding instead.
    current_source_manifest_hash: currentPacket.source_manifest_hash ?? currentPacket.manifest_hash,
    previous_material_manifest_sha256: sha(canonical(previousManifest)),
    current_material_manifest_sha256: sha(canonical(currentManifest)),
    current_packet_diff_sha256: currentPacket.diff_sha256,
    contract_hash: currentPacket.contract_hash,
    skill_bundle_hash: currentPacket.skill_bundle_hash,
    previous_tree: previousPacket.source_revision.snapshot_tree,
    current_tree: currentPacket.source_revision.snapshot_tree,
    changes_diff_sha256: sha(deltaSource.unified_diff),
    changes_diff_size: Buffer.byteLength(deltaSource.unified_diff),
    changed_files: deltaSource.changed_files,
    changed_materials: changedMaterials,
  };
  return {
    previous_findings: previousFindings,
    closure_evidence: closureEvidence,
    delta_manifest: deltaManifest,
    affected_materials: affectedMaterials,
    current_material_manifest: currentManifest,
    cross_stage_carryovers: crossStageCarryovers,
    required_skill_lens_hashes: requiredSkills.map(({ name, bundle }) => ({ skill: name, bundle_hash: bundle.sha256 })),
  };
}
function materialInstruction({ packet, intent, attachmentIds, continuation = false }) {
  if (!Array.isArray(attachmentIds) || attachmentIds.some((id) => typeof id !== "string" || !id)) throw new TypeError("attachmentIds are required");
  return [
    continuation ? "Continue the existing review session using only this isolated delta attachment workspace." : "Review only this isolated attachment workspace.",
    "Do not access a repository, run git, request host or worktree paths, or infer missing material.",
    `attachment_ids=${attachmentIds.join(",")}`,
    `stage=${packet.stage}`,
    `review_track=${packet.review_track ?? "default"}`,
    `contract_hash=${intent.contract_hash}`,
    `skill_bundle_hash=${intent.skill_bundle_hash}`,
    "Read manifest.json first. Return only reviewer-output JSON.",
  ].join("\n");
}

// The host never renders packet, diff, or continuation data into a prompt.
// `file_only` is delivered as files, while `always_embed` is rendered and
// bounded by the broker after this instruction is finalized.
export function initialPrompt({ packet, intent, attachmentIds }) {
  return materialInstruction({ packet, intent, attachmentIds });
}
export function continuationPrompt(delta, { packet, intent, attachmentIds } = {}) {
  if (!delta?.delta_manifest) throw new TypeError("continuation delta is required");
  return materialInstruction({ packet, intent, attachmentIds, continuation: true });
}
