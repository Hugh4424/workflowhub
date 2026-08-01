import { contentHash, verifySourceManifest } from "./canonical-source.mjs";

const STATUSES = new Set(["accepted", "withdrawn", "rejected", "unknown"]);

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validRef(ref) {
  return ref && typeof ref === "object" && nonEmptyString(ref.kind) && nonEmptyString(ref.uri_or_path) && nonEmptyString(ref.content_hash);
}

function hashMaterial(value, isRecord = true) {
  if (Array.isArray(value)) return value.map((item) => hashMaterial(item, false));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== "stale" && (!isRecord || key !== "content_hash"))
    .map(([key, item]) => [key, hashMaterial(item, false)]));
}

export function computeRequirementContentHash(record) {
  return contentHash(hashMaterial(record));
}

export function computeLedgerHash(ledger) {
  const { ledger_hash: _ledgerHash, ...material } = ledger ?? {};
  return contentHash(material);
}

export function verifyRequirementHashes(ledger) {
  const errors = [];
  for (const record of ledger?.requirements ?? []) {
    if (!nonEmptyString(record?.requirement_id)) continue;
    if (record.content_hash !== computeRequirementContentHash(record)) {
      errors.push(`requirement ${record.requirement_id} content hash mismatch`);
    }
  }
  if (ledger?.ledger_hash !== computeLedgerHash(ledger)) errors.push("LEDGER_HASH_MISMATCH");
  return { ok: errors.length === 0, errors };
}

function hasCompleteLineage(record) {
  return hasValidLineageReferences(record)
    && record.artifact_refs.length > 0
    && record.acceptance_criteria_refs.length > 0;
}

function hasValidLineageReferences(record) {
  return validRef(record.source_ref) && validRef(record.decision_ref)
    && Array.isArray(record.artifact_refs) && record.artifact_refs.every(validRef)
    && Array.isArray(record.acceptance_criteria_refs) && record.acceptance_criteria_refs.every(validRef);
}

export function validateRequirementLedger(ledger) {
  const errors = [];
  if (!ledger || typeof ledger !== "object" || ledger.schema_version !== "v1") errors.push("schema_version must be v1");
  if (!nonEmptyString(ledger?.source_manifest_hash)) errors.push("source_manifest_hash is required");
  if (!nonEmptyString(ledger?.ledger_hash)) errors.push("ledger_hash is required");
  if (!Array.isArray(ledger?.requirements) || ledger.requirements.length === 0) {
    errors.push("requirements must be a non-empty array");
    return { ok: false, errors };
  }
  const ids = new Set();
  for (const record of ledger.requirements) {
    if (!nonEmptyString(record?.requirement_id)) {
      errors.push("requirement_id must be a non-empty immutable string");
      continue;
    }
    if (ids.has(record.requirement_id)) errors.push(`duplicate immutable requirement_id: ${record.requirement_id}`);
    ids.add(record.requirement_id);
    if (!STATUSES.has(record.status)) errors.push(`requirement ${record.requirement_id} has invalid status`);
    if (!Array.isArray(record.upstream_hashes)) errors.push(`requirement ${record.requirement_id} upstream_hashes must be an array`);
    if (typeof record.stale !== "boolean") errors.push(`requirement ${record.requirement_id} stale must be boolean`);
    if (!hasValidLineageReferences(record)) errors.push(`requirement ${record.requirement_id} requires valid source-to-decision-to-artifact-to-acceptance lineage references`);
    if (record.status === "accepted" && !hasCompleteLineage(record)) errors.push(`accepted requirement ${record.requirement_id} requires non-empty artifact and acceptance-criteria lineage`);
  }
  errors.push(...verifyRequirementHashes(ledger).errors);
  return { ok: errors.length === 0, errors };
}

export function calculateCoverage(ledger) {
  const requirements = ledger?.requirements ?? [];
  const accepted = requirements.filter((record) => record.status === "accepted");
  const coveredRecords = accepted.filter(hasCompleteLineage);
  return {
    covered: coveredRecords.length,
    total: accepted.length,
    withdrawn: requirements.filter((record) => record.status === "withdrawn").length,
    missing_ids: accepted.filter((record) => !hasCompleteLineage(record)).map((record) => record.requirement_id),
  };
}

export function createRequirementsCoverage(ledger) {
  const coverage = calculateCoverage(ledger);
  const unsigned = {
    schema_version: "v1",
    ledger_hash: ledger?.ledger_hash ?? "",
    ...coverage,
    missing_ids: [...coverage.missing_ids].sort(),
  };
  return { ...unsigned, coverage_hash: contentHash(unsigned) };
}

function asRef(value, fallbackKind, requirementId) {
  if (validRef(value)) return { ...value };
  return { kind: fallbackKind, uri_or_path: `source-manifest://${requirementId}`, content_hash: "" };
}

/**
 * Creates an immutable ledger from a verified source manifest plus caller
 * supplied decision/artifact/AC mappings.  Missing mappings are preserved as
 * empty lineage and cause validation/aggregation to fail; no coverage is made
 * up from observed step receipts.
 */
export function createRequirementLedger({ source_manifest, mappings = {} }) {
  const sourceResult = verifySourceManifest(source_manifest);
  if (!sourceResult.ok) return { ok: false, code: sourceResult.errors[0] ?? "SOURCE_MANIFEST_INVALID", errors: sourceResult.errors };
  const requirements = source_manifest.atoms.map((atom) => {
    const mapping = mappings[atom.requirement_id] ?? {};
    const record = {
      requirement_id: atom.requirement_id,
      status: atom.status,
      source_ref: { kind: "source_atom", uri_or_path: `source-manifest://${source_manifest.manifest_hash}/${atom.requirement_id}`, content_hash: atom.content_hash },
      decision_ref: asRef(mapping.decision_ref, "decision", atom.requirement_id),
      artifact_refs: Array.isArray(mapping.artifact_refs) ? mapping.artifact_refs.map((ref) => ({ ...ref })) : [],
      acceptance_criteria_refs: Array.isArray(mapping.acceptance_criteria_refs) ? mapping.acceptance_criteria_refs.map((ref) => ({ ...ref })) : [],
      upstream_hashes: [source_manifest.manifest_hash, atom.content_hash, ...(mapping.upstream_hashes ?? [])].filter(nonEmptyString).sort(),
      stale: atom.stale === true || mapping.stale === true,
    };
    record.content_hash = computeRequirementContentHash(record);
    return record;
  }).sort((left, right) => left.requirement_id.localeCompare(right.requirement_id));
  const unsigned = { schema_version: "v1", source_manifest_hash: source_manifest.manifest_hash, requirements };
  const ledger = { ...unsigned, ledger_hash: contentHash(unsigned) };
  const result = validateRequirementLedger(ledger);
  return result.ok ? { ok: true, ledger } : { ok: false, code: "REQUIREMENT_LEDGER_INVALID", errors: result.errors, ledger };
}

export function propagateStale(ledger, changedHashes = []) {
  const changed = new Set(changedHashes.filter(nonEmptyString));
  const requirements = (ledger?.requirements ?? []).map((record) => {
    const next = structuredClone(record);
    const hashes = [
      ...(next.upstream_hashes ?? []),
      next.source_ref?.content_hash,
      next.decision_ref?.content_hash,
    ].filter(nonEmptyString);
    if (hashes.some((hash) => changed.has(hash))) {
      next.stale = true;
      if (next.source_ref) next.source_ref.stale = true;
      if (next.decision_ref) next.decision_ref.stale = true;
      next.artifact_refs = (next.artifact_refs ?? []).map((ref) => ({ ...ref, stale: true }));
      next.acceptance_criteria_refs = (next.acceptance_criteria_refs ?? []).map((ref) => ({ ...ref, stale: true }));
    }
    return next;
  });
  return { ...ledger, requirements };
}
