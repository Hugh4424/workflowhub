import { createCanonicalSource } from "./canonical-source.mjs";

function normalizeSource(source, source_type, source_id) {
  return createCanonicalSource({
    source_type,
    source_id,
    revision: source?.revision ?? source?.source_version,
    requirements: source?.requirements,
    completeness: source?.completeness ?? "incomplete",
    evidence_refs: source?.evidence_refs ?? [],
  });
}

export function normalizeMulticaSource(source) {
  return normalizeSource(source, "multica", source?.issue_id);
}

export function normalizeOfflineSource(source) {
  return normalizeSource(source, "offline_fixture", source?.source_id);
}
