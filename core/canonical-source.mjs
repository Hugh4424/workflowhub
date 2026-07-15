import { createHash } from "node:crypto";

// RFC 8785 JSON Canonicalization Scheme for the values WorkflowHub stores.
// JSON.stringify supplies ECMAScript's interoperable number/string encoding;
// sorting object members here provides the missing deterministic ordering.
export function canonicalJson(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("canonical JSON does not support non-finite numbers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (!value || typeof value !== "object") throw new TypeError("canonical JSON supports JSON values only");
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

export function contentHash(value) {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

const REQUIREMENT_STATUSES = new Set(["accepted", "withdrawn", "rejected", "unknown"]);

function stringList(value, field, errors) {
  if (!Array.isArray(value) || value.some((item) => !nonEmptyString(item))) {
    errors.push(`${field} must be an array of non-empty strings`);
  }
}

export function validateSourceAtom(atom) {
  const errors = [];
  if (!atom || typeof atom !== "object" || Array.isArray(atom)) return { ok: false, errors: ["source atom must be an object"] };
  if (!nonEmptyString(atom.requirement_id)) errors.push("source atom requirement_id is required");
  if (!nonEmptyString(atom.text)) errors.push(`source atom ${atom.requirement_id ?? "<unknown>"} text is required`);
  if (!nonEmptyString(atom.owner)) errors.push(`source atom ${atom.requirement_id ?? "<unknown>"} owner is required`);
  if (!nonEmptyString(atom.authority)) errors.push(`source atom ${atom.requirement_id ?? "<unknown>"} authority is required`);
  if (!REQUIREMENT_STATUSES.has(atom.status)) errors.push(`source atom ${atom.requirement_id ?? "<unknown>"} status is invalid`);
  if (typeof atom.stale !== "boolean") errors.push(`source atom ${atom.requirement_id ?? "<unknown>"} stale must be boolean`);
  stringList(atom.derived_from, `source atom ${atom.requirement_id ?? "<unknown>"} derived_from`, errors);
  stringList(atom.supersedes, `source atom ${atom.requirement_id ?? "<unknown>"} supersedes`, errors);
  return { ok: errors.length === 0, errors };
}

function atomHashMaterial(atom) {
  const { content_hash: _contentHash, ...material } = atom;
  return material;
}

export function createCanonicalSource({ source_type, source_id, revision, requirements, completeness = "complete", evidence_refs = [] }) {
  if (!nonEmptyString(source_type) || !nonEmptyString(source_id) || !nonEmptyString(revision) || !Array.isArray(requirements) || requirements.length === 0) {
    return { ok: false, code: "SOURCE_INCOMPLETE" };
  }
  if (completeness === "unknown") return { ok: false, code: "SOURCE_UNKNOWN" };
  if (completeness !== "complete") return { ok: false, code: "SOURCE_INCOMPLETE" };

  // Legacy adapters can still supply plain requirement strings.  They remain
  // canonical source input, but cannot become a P2 source manifest until the
  // caller supplies atom ownership/authority and derivation fields.
  const source = { source_type, source_id, revision, completeness, requirements, evidence_refs };
  return { ok: true, ...source, content_hash: contentHash(source) };
}

export function createSourceManifest({ canonical_source, atoms }) {
  if (!canonical_source?.ok || !nonEmptyString(canonical_source.content_hash)) {
    return { ok: false, code: "SOURCE_INCOMPLETE", errors: ["canonical_source must be complete"] };
  }
  if (!Array.isArray(atoms) || atoms.length === 0) return { ok: false, code: "SOURCE_INCOMPLETE", errors: ["source atoms are required"] };

  const errors = [];
  const ids = new Set();
  const canonicalAtoms = atoms.map((atom) => {
    const result = validateSourceAtom(atom);
    errors.push(...result.errors);
    if (ids.has(atom?.requirement_id)) errors.push(`duplicate immutable requirement_id: ${atom.requirement_id}`);
    ids.add(atom?.requirement_id);
    const next = { ...atom, derived_from: [...(atom?.derived_from ?? [])].sort(), supersedes: [...(atom?.supersedes ?? [])].sort() };
    return { ...next, content_hash: contentHash(atomHashMaterial(next)) };
  }).sort((left, right) => left.requirement_id.localeCompare(right.requirement_id));

  const byId = new Map(canonicalAtoms.map((atom) => [atom.requirement_id, atom]));
  for (const atom of canonicalAtoms) {
    for (const id of [...atom.derived_from, ...atom.supersedes]) {
      if (!byId.has(id)) errors.push(`source atom ${atom.requirement_id} references unknown requirement ${id}`);
      if (id === atom.requirement_id) errors.push(`source atom ${atom.requirement_id} cannot reference itself`);
    }
  }
  const visiting = new Set(); const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) { errors.push(`source atom DAG has cycle at ${id}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id)?.derived_from ?? []) if (byId.has(dependency)) visit(dependency);
    visiting.delete(id); visited.add(id);
  }
  for (const id of byId.keys()) visit(id);
  if (errors.length) return { ok: false, code: "SOURCE_INCOMPLETE", errors };

  const unsigned = {
    schema_version: "v1",
    source: {
      source_type: canonical_source.source_type,
      source_id: canonical_source.source_id,
      revision: canonical_source.revision,
      content_hash: canonical_source.content_hash,
    },
    atoms: canonicalAtoms,
  };
  const manifest_hash = contentHash(unsigned);
  return { ok: true, manifest: { ...unsigned, manifest_hash }, manifest_hash };
}

export function verifySourceManifest(manifest) {
  if (!manifest || manifest.schema_version !== "v1" || !Array.isArray(manifest.atoms) || !nonEmptyString(manifest.manifest_hash)) {
    return { ok: false, errors: ["SOURCE_MANIFEST_INVALID"] };
  }
  const { manifest_hash, ...unsigned } = manifest;
  const rebuilt = createSourceManifest({
    canonical_source: { ok: true, ...unsigned.source, completeness: "complete", requirements: unsigned.atoms, content_hash: unsigned.source?.content_hash },
    atoms: unsigned.atoms,
  });
  if (!rebuilt.ok) return { ok: false, errors: rebuilt.errors };
  return rebuilt.manifest_hash === manifest_hash ? { ok: true, errors: [] } : { ok: false, errors: ["SOURCE_MANIFEST_HASH_MISMATCH"] };
}
