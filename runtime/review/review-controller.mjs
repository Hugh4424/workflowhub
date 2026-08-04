import { createHash } from "node:crypto";

const OID = /^[a-f0-9]{40,64}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const CHANGE_CLASSIFICATION_VERSION = "wh-review-change-classification.v1";
const MATERIAL_CATEGORY = Object.freeze({
  raw_requirement: "decision", objective_facts: "evidence", approved_direction: "decision",
  approved_decision: "decision", draft_spec_or_acceptance: "contract", draft_spec: "contract",
  approved_spec: "contract", draft_plan: "plan", draft_tasks: "plan",
  acceptance_criteria: "acceptance", acceptance_map: "acceptance", acceptance_evidence: "evidence",
  test_evidence: "evidence", evidence_map: "evidence", context_map: "structured_context",
  phase_map: "structured_context", impact_map: "structured_context", reuse_map: "structured_context",
  phase_coverage: "structured_context", seam_index: "structured_context", ac_trace: "acceptance",
  open_exceptions: "evidence", notes: "explanation", explanation: "explanation",
});
const CATEGORY_DIMENSIONS = Object.freeze({
  decision: ["direction"], contract: ["interface"], plan: ["phase_order"],
  acceptance: ["acceptance_criteria"], structured_context: ["interface", "state"],
  evidence: ["test_strategy"], unknown: ["direction"], explanation: [],
});

function oid(value, label) {
  if (typeof value !== "string" || !OID.test(value)) throw new TypeError(`${label} must be a Git tree OID`);
  return value;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

export function deriveChangeClassification({ previousSnapshotTree, currentSnapshotTree, previousManifest = null, currentManifest } = {}) {
  oid(previousSnapshotTree, "change classification previousSnapshotTree");
  oid(currentSnapshotTree, "change classification currentSnapshotTree");
  const current = classificationManifest(currentManifest, "current classification manifest");
  const previous = previousManifest === null ? null : classificationManifest(previousManifest, "previous classification manifest");
  const priorByIdentity = new Map((previous?.entries ?? []).map((entry) => [entry.identity, entry]));
  const currentByIdentity = new Map(current.entries.map((entry) => [entry.identity, entry]));
  const changedCategories = new Set();
  for (const identity of new Set([...priorByIdentity.keys(), ...currentByIdentity.keys()])) {
    const prior = priorByIdentity.get(identity); const next = currentByIdentity.get(identity);
    if (!prior || !next || prior.sha256 !== next.sha256 || prior.category !== next.category) {
      changedCategories.add(next?.category ?? prior?.category ?? "unknown");
    }
  }
  if (previous === null) changedCategories.add("unknown");
  const changedDimensions = [...new Set([...changedCategories].flatMap((category) => CATEGORY_DIMENSIONS[category] ?? CATEGORY_DIMENSIONS.unknown))].sort();
  return Object.freeze({
    version: CHANGE_CLASSIFICATION_VERSION,
    source: "frozen_bundle_manifest",
    previous_snapshot_tree: previousSnapshotTree,
    current_snapshot_tree: currentSnapshotTree,
    source_diff_sha256: createHash("sha256").update(canonicalJson({ previous, current })).digest("hex"),
    previous_manifest: previous,
    current_manifest: current,
    changed_dimensions: changedDimensions,
    structural: changedDimensions.length > 0,
  });
}

function classificationManifest(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)
      || value.version !== "wh-review-classification-manifest.v1" || !Array.isArray(value.entries)) {
    throw new TypeError(`${label} is invalid`);
  }
  const identities = new Set();
  const entries = value.entries.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)
        || typeof entry.identity !== "string" || entry.identity.trim() === "" || identities.has(entry.identity)
        || typeof entry.category !== "string" || !SHA256.test(entry.sha256 ?? "")) {
      throw new TypeError(`${label}.entries[${index}] is invalid`);
    }
    identities.add(entry.identity);
    return { identity: entry.identity, category: entry.category, sha256: entry.sha256 };
  }).sort((left, right) => left.identity.localeCompare(right.identity));
  return { version: value.version, entries };
}

export function buildClassificationManifest(materials = {}) {
  if (!materials || typeof materials !== "object" || Array.isArray(materials)) throw new TypeError("classification materials must be an object");
  const entries = Object.entries(materials)
    .filter(([key]) => !["review_instructions", "response_ledger", "previous_review"].includes(key))
    .map(([identity, value]) => ({
      identity,
      category: MATERIAL_CATEGORY[identity] ?? "unknown",
      sha256: createHash("sha256").update(canonicalJson(value)).digest("hex"),
    }))
    .sort((left, right) => left.identity.localeCompare(right.identity));
  return Object.freeze({ version: "wh-review-classification-manifest.v1", entries: Object.freeze(entries) });
}

/**
 * A review is one immutable quality fact for one snapshot. Findings remain
 * findings; there is no response-ledger or zero-provider resolution round.
 * A changed snapshot gets one new initial review, while a same-snapshot retry
 * is closed by the existing fact.
 */
export function selectReviewRound({ stage, route, previousResult = null, currentSnapshotTree = null } = {}) {
  if (!["make-decision", "build-spec", "build-plan", "build-code", "verify-code"].includes(stage)) throw new TypeError("stage is invalid");
  if (!route || typeof route !== "object") return { round: "legacy", reason: "legacy_3rd_review" };
  if (previousResult === null) return { round: "initial", reason: "first_review" };
  if (!['pass', 'revise_required'].includes(previousResult.verdict)) throw new TypeError("previous result must be semantic");
  if (currentSnapshotTree !== null && previousResult.snapshot_tree !== currentSnapshotTree) {
    return { round: "initial", reason: "changed_snapshot" };
  }
  return { round: "none", reason: "current_quality_fact_recorded" };
}
