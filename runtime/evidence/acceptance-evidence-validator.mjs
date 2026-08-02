const GIT_OID = /^[a-f0-9]{40}$/i;
const ACCEPTANCE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

/** Validate evidence shape only; it has no TaskKernel or TaskHandle dependency. */
export function validateAcceptanceEvidence(value, label = "acceptance evidence") {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  for (const key of Object.keys(value)) if (!["schema_version", "acceptance_criterion_id", "result", "refs", "snapshot_tree", "summary"].includes(key)) throw new Error(`${label} has unknown field ${key}`);
  if (value.schema_version !== "acceptance-evidence.v1") throw new Error(`${label} schema_version must be acceptance-evidence.v1`);
  if (typeof value.acceptance_criterion_id !== "string" || !ACCEPTANCE_ID.test(value.acceptance_criterion_id)) throw new Error(`${label} acceptance_criterion_id must be stable and non-empty`);
  if (!new Set(["pass", "fail"]).has(value.result)) throw new Error(`${label} result must be pass or fail`);
  if (!Array.isArray(value.refs) || value.refs.length === 0) throw new Error(`${label} refs must be a non-empty array`);
  const refs = value.refs.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || Object.keys(entry).some((key) => !["ref", "sha256"].includes(key)) || typeof entry.ref !== "string" || !/^evidence\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(entry.ref) || entry.ref.includes("..") || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")) throw new Error(`${label} refs[${index}] must contain canonical ref and sha256`);
    return { ref: entry.ref, sha256: entry.sha256 };
  });
  if (value.snapshot_tree !== undefined && (typeof value.snapshot_tree !== "string" || !GIT_OID.test(value.snapshot_tree))) throw new Error(`${label} snapshot_tree must be a Git tree id`);
  let summary;
  if (value.summary !== undefined) {
    if (!value.summary || typeof value.summary !== "object" || Array.isArray(value.summary)) throw new Error(`${label}.summary must be an object`);
    const fields = ["scenario", "oracle", "actual_outcome", "evidence_type", "coverage_limits", "exceptions"];
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
  }
  return Object.freeze({ schema_version: value.schema_version, acceptance_criterion_id: value.acceptance_criterion_id, result: value.result, refs: Object.freeze(refs), ...(value.snapshot_tree === undefined ? {} : { snapshot_tree: value.snapshot_tree }), ...(summary === undefined ? {} : { summary: Object.freeze(summary) }) });
}
