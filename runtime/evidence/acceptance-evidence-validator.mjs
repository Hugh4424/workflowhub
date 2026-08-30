const GIT_OID = /^[a-f0-9]{40}$/i;
const ACCEPTANCE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const ANCHOR_PATH = /^(?:[A-Za-z0-9][A-Za-z0-9._-]*)(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;
const EVIDENCE_REF = /^(?:evidence|quality\/evidence)\/[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;

function validateSummaryAnchor(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an anchor object`);
  const allowed = new Set(["id", "path", "start_line", "end_line", "role", "reason"]);
  if (Object.keys(value).some((key) => !allowed.has(key))) throw new Error(`${label} has unknown field`);
  const expectedRole = label.endsWith(".implementation_anchor") ? "implementation"
    : label.endsWith(".verification_anchor") ? "verification" : null;
  if (typeof value.id !== "string" || value.id.trim() === ""
      || typeof value.path !== "string" || !ANCHOR_PATH.test(value.path) || value.path.split("/").includes("..")
      || !Number.isSafeInteger(value.start_line) || value.start_line < 1
      || !Number.isSafeInteger(value.end_line) || value.end_line < value.start_line
      || typeof value.role !== "string" || value.role.trim() === ""
      || (expectedRole !== null && value.role !== expectedRole)
      || (value.reason !== undefined && (typeof value.reason !== "string" || value.reason.trim() === ""))) {
    throw new Error(`${label} requires id, relative path, line range, and role`);
  }
  return Object.freeze({ ...value });
}

/** Validate evidence shape only; it has no TaskKernel or TaskHandle dependency. */
export function validateAcceptanceEvidence(value, label = "acceptance evidence") {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  for (const key of Object.keys(value)) if (!["schema_version", "acceptance_criterion_id", "result", "refs", "snapshot_tree", "source_digest", "summary", "freshness"].includes(key)) throw new Error(`${label} has unknown field ${key}`);
  if (value.schema_version !== "acceptance-evidence.v1") throw new Error(`${label} schema_version must be acceptance-evidence.v1`);
  if (typeof value.acceptance_criterion_id !== "string" || !ACCEPTANCE_ID.test(value.acceptance_criterion_id)) throw new Error(`${label} acceptance_criterion_id must be stable and non-empty`);
  if (!new Set(["pass", "fail", "inconclusive", "deferred"]).has(value.result)) throw new Error(`${label} result must be pass, fail, inconclusive, or deferred`);
  if (!Array.isArray(value.refs) || value.refs.length === 0) throw new Error(`${label} refs must be a non-empty array`);
  const refs = value.refs.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || Object.keys(entry).some((key) => !["ref", "sha256"].includes(key)) || typeof entry.ref !== "string" || !EVIDENCE_REF.test(entry.ref) || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")) throw new Error(`${label} refs[${index}] must contain canonical ref and sha256`);
    return { ref: entry.ref, sha256: entry.sha256 };
  });
  if (value.snapshot_tree !== undefined && (typeof value.snapshot_tree !== "string" || !GIT_OID.test(value.snapshot_tree))) throw new Error(`${label} snapshot_tree must be a Git tree id`);
  if (value.source_digest !== undefined && (typeof value.source_digest !== "string" || !/^[a-f0-9]{64}$/.test(value.source_digest))) throw new Error(`${label} source_digest must be a sha256`);
  let freshness;
  if (value.freshness !== undefined) {
    if (!value.freshness || typeof value.freshness !== "object" || Array.isArray(value.freshness)) throw new Error(`${label}.freshness must be an object`);
    if (!new Set(["current", "stale", "missing"]).has(value.freshness.status)) throw new Error(`${label}.freshness.status must be current, stale, or missing`);
    if (typeof value.freshness.evaluated_at !== "string" || value.freshness.evaluated_at.trim() === "") throw new Error(`${label}.freshness.evaluated_at must be a non-empty ISO timestamp`);
    if (typeof value.freshness.snapshot_tree !== "string" || !GIT_OID.test(value.freshness.snapshot_tree)) throw new Error(`${label}.freshness.snapshot_tree must be a Git tree id`);
    if (typeof value.freshness.material_revision !== "string" || !/^revision-[a-f0-9]{64}$/.test(value.freshness.material_revision)) throw new Error(`${label}.freshness.material_revision must be a material revision`);
    if (!Array.isArray(value.freshness.evidence_freshness) || value.freshness.evidence_freshness.length === 0) throw new Error(`${label}.freshness.evidence_freshness must be a non-empty array`);
    freshness = Object.freeze({
      status: value.freshness.status,
      evaluated_at: value.freshness.evaluated_at,
      snapshot_tree: value.freshness.snapshot_tree,
      material_revision: value.freshness.material_revision,
      evidence_freshness: Object.freeze(value.freshness.evidence_freshness.map((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.ref !== "string" || typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(entry.sha256) || !new Set(["current", "stale", "missing"]).has(entry.status)) {
          throw new Error(`${label}.freshness.evidence_freshness entry must contain ref, sha256, and status`);
        }
        return Object.freeze({ ref: entry.ref, sha256: entry.sha256, status: entry.status });
      })),
    });
  }
  let summary;
  if (value.summary !== undefined) {
    if (!value.summary || typeof value.summary !== "object" || Array.isArray(value.summary)) throw new Error(`${label}.summary must be an object`);
    const fields = ["scenario", "oracle", "actual_outcome", "evidence_type", "coverage_limits", "exceptions", "implementation_anchor", "verification_anchor"];
    for (const key of Object.keys(value.summary)) if (!fields.includes(key)) throw new Error(`${label}.summary has unknown field ${key}`);
    if (Object.keys(value.summary).length === 0) throw new Error(`${label}.summary must contain at least one non-empty field`);
    summary = {};
    for (const key of ["scenario", "oracle", "actual_outcome", "evidence_type"]) {
      if (value.summary[key] !== undefined) {
        if (typeof value.summary[key] !== "string" || value.summary[key].trim() === "") throw new Error(`${label}.summary.${key} must be non-empty text`);
        summary[key] = value.summary[key];
      }
    }
    for (const key of ["coverage_limits", "exceptions"]) {
      if (value.summary[key] !== undefined) {
        if (!Array.isArray(value.summary[key]) || value.summary[key].length === 0 || value.summary[key].some((item) => typeof item !== "string" || item.trim() === "")) throw new Error(`${label}.summary.${key} must be a non-empty text array`);
        summary[key] = Object.freeze([...value.summary[key]]);
      }
    }
    for (const key of ["implementation_anchor", "verification_anchor"]) {
      if (value.summary[key] !== undefined) summary[key] = validateSummaryAnchor(value.summary[key], `${label}.summary.${key}`);
    }
  }
  return Object.freeze({ schema_version: value.schema_version, acceptance_criterion_id: value.acceptance_criterion_id, result: value.result, refs: Object.freeze(refs), ...(value.snapshot_tree === undefined ? {} : { snapshot_tree: value.snapshot_tree }), ...(value.source_digest === undefined ? {} : { source_digest: value.source_digest }), ...(summary === undefined ? {} : { summary: Object.freeze(summary) }), ...(freshness === undefined ? {} : { freshness: Object.freeze(freshness) }) });
}
