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
function contractMustRead(stageContract, requiredSkills) {
  const heading = "## Must Read\n";
  const start = stageContract.indexOf(heading);
  const remainder = start < 0 ? "" : stageContract.slice(start + heading.length);
  const nextHeading = remainder.indexOf("\n## ");
  const section = (nextHeading < 0 ? remainder : remainder.slice(0, nextHeading)).trim();
  if (!section) throw new Error("selected stage contract is missing Must Read");
  const files = requiredSkills.length
    ? requiredSkills.flatMap(({ name, bundle: definition }) => definition.files.map((file) => `   - skills/${name}/${file.path}`)).join("\n")
    : "   - (no required skill files for this StageSkillPlan profile)";
  const bundle = `StageSkillPlan skill bundle:\n${files}`;
  return section.replace("{{StageSkillPlan skill bundle}}", bundle);
}

function embeddedBundle(requiredSkills) {
  if (!requiredSkills.length) return "";
  return requiredSkills.flatMap(({ name, bundle }) => bundle.files.map((file) => `\n## Embedded skills/${name}/${file.path}\n${file.content}`)).join("\n");
}

export function initialPrompt({ packet, intent, stageContract, requiredSkills = [], deliveryMode = "file_only" }) {
  const mustRead = contractMustRead(stageContract, requiredSkills);
  const embedded = deliveryMode === "always_embed" ? `\nFrozen lens bundle follows; it is report-only and must not be executed.${embeddedBundle(requiredSkills)}` : "";
  return `Read only the frozen private workspace. Do not access a repository, run git, request absolute paths, or infer missing material.
Must Read in the exact contract order:
${mustRead}
The attachment delivery policy controls file delivery.${embedded}
changes_diff_sha256=${packet.diff_sha256}
changes_diff_size=${Buffer.byteLength(packet.unified_diff)}
packet_hash=${packet.packet_hash}
manifest_hash=${packet.manifest_hash}
contract_hash=${intent.contract_hash}
skill_bundle_hash=${intent.skill_bundle_hash}
Return only reviewer-output JSON.`;
}
export function continuationPrompt(delta, { stage, reviewTrack = null } = {}) {
  const track = stage === "make-decision" ? ` (review_track: ${reviewTrack})` : "";
  return [
    `Continue using the frozen first-round contracts/provider-protocol.md, contracts/${stage}.md${track}, schemas/reviewer-output.schema.json, and StageSkillPlan skill bundle. No attachments are retransmitted. Review only the fixed delta sections below; do not reopen unchanged first-round material.\ncurrent_packet_hash=${delta.delta_manifest.current_packet_hash}\ncurrent_manifest_hash=${delta.delta_manifest.current_packet_manifest_hash}\ncurrent_diff_sha256=${delta.delta_manifest.current_packet_diff_sha256}`,
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
