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
  review_delta: "structured_context",
});
const CATEGORY_DIMENSIONS = Object.freeze({
  decision: ["direction"], contract: ["interface"], plan: ["phase_order"],
  acceptance: ["acceptance_criteria"], structured_context: ["interface", "state"],
  evidence: ["test_strategy"], unknown: ["direction"], explanation: [],
});
const DIRECT_IMPACT_IDENTITIES = Object.freeze({
  raw_requirement: ["approved_decision", "draft_spec", "context_map", "evidence_map"],
  approved_decision: ["draft_spec", "context_map", "evidence_map"],
  draft_spec: ["context_map", "evidence_map"],
  context_map: ["draft_spec", "evidence_map"],
  evidence_map: ["draft_spec", "context_map"],
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

function materialBytes(value) {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "string") return Buffer.from(value, "utf8");
  return Buffer.from(canonicalJson(value), "utf8");
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
    .filter(([key]) => !["review_instructions", "response_ledger", "previous_review", "review_delta"].includes(key))
    .map(([identity, value]) => ({
      identity,
      category: MATERIAL_CATEGORY[identity] ?? "unknown",
      sha256: createHash("sha256").update(materialBytes(value)).digest("hex"),
    }))
    .sort((left, right) => left.identity.localeCompare(right.identity));
  return Object.freeze({ version: "wh-review-classification-manifest.v1", entries: Object.freeze(entries) });
}

/**
 * A review is one immutable quality fact for one snapshot. Findings remain
 * findings; there is no response-ledger or zero-provider resolution round.
 * The first three stages can use a runner-generated delta after a prior pass;
 * a same-snapshot retry is always closed by the existing fact.
 */
const INCREMENTAL_STAGES = new Set(["make-decision", "build-spec", "build-plan"]);

export function selectReviewRound({ stage, route, previousResult = null, currentSnapshotTree = null, incrementalAvailable = false } = {}) {
  if (!["make-decision", "build-spec", "build-plan", "build-code", "verify-code"].includes(stage)) throw new TypeError("stage is invalid");
  if (!route || typeof route !== "object") return { round: "legacy", reason: "legacy_3rd_review" };
  if (previousResult === null) return { round: "initial", reason: "first_review" };
  if (!['pass', 'revise_required'].includes(previousResult.verdict)) throw new TypeError("previous result must be semantic");
  if (currentSnapshotTree !== null && previousResult.snapshot_tree !== currentSnapshotTree) {
    if (INCREMENTAL_STAGES.has(stage) && previousResult.verdict === "pass" && incrementalAvailable === true) {
      return { round: "incremental", reason: "changed_material_incremental" };
    }
    return { round: "initial", reason: "changed_snapshot" };
  }
  return { round: "none", reason: "current_quality_fact_recorded" };
}

function serializableMaterial(value) {
  return Buffer.isBuffer(value) ? value.toString("utf8") : value;
}

/**
 * Build the runner-owned scope for a follow-up review. The prior result only
 * contributes authenticated hashes; current material bytes come from the
 * caller's already-frozen review input. This keeps the delta auditable without
 * adding a task ledger or allowing a caller to choose a review round.
 */
export function buildIncrementalReviewDelta({ stage, previousResult = null, currentSnapshotTree = null, currentMaterials = {} } = {}) {
  if (!INCREMENTAL_STAGES.has(stage)) return null;
  if (!previousResult || previousResult.verdict !== "pass") return null;
  if (typeof currentSnapshotTree !== "string" || !OID.test(currentSnapshotTree)) return null;
  if (!currentMaterials || typeof currentMaterials !== "object" || Array.isArray(currentMaterials)) return null;
  const previousEntries = previousResult.classification_manifest?.entries;
  if (!Array.isArray(previousEntries)) return null;
  const previousByIdentity = new Map(previousEntries.map((entry) => [entry.identity, entry]));
  const currentEntries = buildClassificationManifest(currentMaterials).entries;
  const currentByIdentity = new Map(currentEntries.map((entry) => [entry.identity, entry]));
  const changedMaterials = [];
  for (const identity of [...new Set([...previousByIdentity.keys(), ...currentByIdentity.keys()])].sort()) {
    const prior = previousByIdentity.get(identity);
    const current = currentByIdentity.get(identity);
    if (prior && current && prior.sha256 === current.sha256) continue;
    changedMaterials.push({
      identity,
      change: prior === undefined ? "added" : current === undefined ? "removed" : "changed",
      ...(prior === undefined ? {} : { previous_sha256: prior.sha256, previous_category: prior.category }),
      ...(current === undefined ? {} : {
        current_sha256: current.sha256,
        current_category: current.category,
        content: serializableMaterial(currentMaterials[identity]),
      }),
    });
  }
  if (changedMaterials.length === 0) return null;
  const changedDimensions = [...new Set(changedMaterials.flatMap((entry) => CATEGORY_DIMENSIONS[entry.current_category ?? entry.previous_category] ?? CATEGORY_DIMENSIONS.unknown))].sort();
  const directImpacts = changedDimensions.map((dimension) => {
    const changedForDimension = changedMaterials
      .filter((entry) => (CATEGORY_DIMENSIONS[entry.current_category ?? entry.previous_category] ?? CATEGORY_DIMENSIONS.unknown).includes(dimension))
      .map((entry) => entry.identity);
    const affected = new Set(changedForDimension);
    for (const identity of changedForDimension) {
      for (const candidate of DIRECT_IMPACT_IDENTITIES[identity] ?? []) {
        if (currentByIdentity.has(candidate)) affected.add(candidate);
      }
    }
    return {
      dimension,
      changed_materials: changedForDimension,
      direct_impact_materials: [...affected].sort(),
      basis: "runner_material_identity_mapping",
      instruction: "Assess each changed material against the named direct-impact materials and the authenticated prior-pass baseline; unchanged bytes remain intentionally omitted.",
    };
  });
  return Object.freeze({
    schema_version: "wh-review-delta.v1",
    scope: "changed_materials_and_direct_impacts",
    stage,
    previous_snapshot_tree: previousResult.snapshot_tree,
    current_snapshot_tree: currentSnapshotTree,
    changed_dimensions: Object.freeze(changedDimensions),
    changed_materials: Object.freeze(changedMaterials),
    direct_impacts: Object.freeze(directImpacts),
    instruction: "Review only changed_materials and their direct impacts. Treat unchanged prior material as already reviewed; do not seek a new pass for unchanged content.",
  });
}
