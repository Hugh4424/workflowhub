import { createHash } from "node:crypto";

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function contentHash(value) {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

export function createCanonicalSource({ source_type, source_id, revision, requirements, completeness = "complete", evidence_refs = [] }) {
  if (!source_type || !source_id || !revision || !Array.isArray(requirements) || requirements.length === 0) {
    return { ok: false, code: "SOURCE_INCOMPLETE" };
  }
  if (completeness === "unknown") return { ok: false, code: "SOURCE_UNKNOWN" };
  if (completeness !== "complete") return { ok: false, code: "SOURCE_INCOMPLETE" };

  const source = { source_type, source_id, revision, completeness, requirements, evidence_refs };
  return { ok: true, ...source, content_hash: contentHash(source) };
}
