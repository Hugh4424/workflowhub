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
  if (deltaSource.unified_diff) affectedMaterials.changes_diff = deltaSource.unified_diff;
  const deltaManifest = {
    baseline_packet_hash: currentPacket.baseline_packet_hash,
    previous_packet_hash: previousPacket.packet_hash,
    current_packet_hash: currentPacket.packet_hash,
    previous_material_manifest_sha256: sha(canonical(previousManifest)),
    current_material_manifest_sha256: sha(canonical(currentManifest)),
    current_packet_manifest_hash: currentPacket.manifest_hash,
    current_packet_diff_sha256: currentPacket.diff_sha256,
    contract_hash: currentPacket.contract_hash,
    skill_bundle_hash: currentPacket.skill_bundle_hash,
    previous_head: previousPacket.source_revision.head,
    current_head: currentPacket.source_revision.head,
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
function renderMaterial(value) {
  if (typeof value === "string") return `|\n${value.split("\n").map((line) => `  ${line}`).join("\n")}`;
  return JSON.stringify(value, null, 2);
}
function renderAffected(materials) {
  const entries = Object.entries(materials);
  return entries.length ? entries.map(([key, value]) => `${key}: ${renderMaterial(value)}`).join("\n") : "{}";
}
export function initialPrompt({ packet, intent }) {
  return `You are an independent read-only reviewer. Review only the frozen files in your private workspace. Do not access a repository, run git, request absolute paths, or infer missing material.\nMust Read: changes.diff (real multiline unified diff) and review-packet.v1.json.\nchanges_diff_sha256=${packet.diff_sha256}\nchanges_diff_size=${Buffer.byteLength(packet.unified_diff)}\npacket_hash=${packet.packet_hash}\ncontract_hash=${intent.contract_hash}\nskill_bundle_hash=${intent.skill_bundle_hash}\nReturn only reviewer-output JSON.`;
}
export function continuationPrompt(delta) {
  return [
    "PreviousFindings\n" + JSON.stringify(delta.previous_findings, null, 2),
    "ClosureEvidence\n" + JSON.stringify(delta.closure_evidence, null, 2),
    "DeltaManifest\n" + JSON.stringify(delta.delta_manifest, null, 2),
    "AffectedMaterials\n" + renderAffected(delta.affected_materials),
    "CurrentMaterialManifest\n" + JSON.stringify(delta.current_material_manifest, null, 2),
    "CrossStageCarryovers\n" + JSON.stringify(delta.cross_stage_carryovers, null, 2),
    "RequiredSkillLensHashes\n" + JSON.stringify(delta.required_skill_lens_hashes, null, 2),
    "OutputRequirements\nReturn only reviewer-output JSON. Re-attest the current packet, manifest, diff, contract, and skill bundle hashes. Do not report old findings as cross-stage carryovers.",
  ].join("\n\n");
}
