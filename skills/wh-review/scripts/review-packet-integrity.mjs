import { createHash } from "node:crypto";

const sha = (value) => createHash("sha256").update(value).digest("hex");

// This is deliberately a canonical JSON encoding, not pretty-printed JSON.
// packet_hash is calculated over the complete packet *except packet_hash*
// itself.  That removes the self-reference while binding manifest_hash,
// diff_sha256, and every provider-visible material field.
export function canonicalPacketJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalPacketJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalPacketJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

export function reviewPacketHash(packet) {
  const { packet_hash: _packetHash, ...packetWithoutSelfHash } = packet;
  return sha(canonicalPacketJson(packetWithoutSelfHash));
}

export function reviewManifestValue(packet) {
  const { packet_hash: _packetHash, manifest_hash: _manifestHash, ...materials } = packet;
  return {
    diff_sha256: materials.diff_sha256,
    changed_files: materials.changed_files.map(({ path, old_path, status, sha256: fileHash, size, old_sha256, old_size }) => ({ path, old_path: old_path ?? null, status, sha256: fileHash ?? null, size: size ?? null, old_sha256: old_sha256 ?? null, old_size: old_size ?? null })),
    raw_requirement: materials.raw_requirement,
    decision_log_excerpt: materials.decision_log_excerpt ?? null,
    acceptance_design_excerpt: materials.acceptance_design_excerpt ?? null,
    acceptance_evidence: materials.acceptance_evidence ?? [],
    planning_artifacts: materials.planning_artifacts ?? [],
    verification_closure: materials.verification_closure ?? [],
    test_evidence: materials.test_evidence ?? [],
    host_verified_facts: materials.host_verified_facts,
    review_lenses: materials.review_lenses ?? [],
    contract_hash: materials.contract_hash,
    skill_bundle_hash: materials.skill_bundle_hash,
    source_revision: materials.source_revision,
  };
}

export function reviewManifestHash(packet) {
  return sha(canonicalPacketJson(reviewManifestValue(packet)));
}
