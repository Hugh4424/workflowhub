const MATERIAL_CHANGE_DIMENSIONS = new Set([
  "direction", "acceptance_criteria", "interface", "schema", "state", "security",
  "concurrency", "topology", "phase_order", "test_strategy",
]);
import { createHash } from "node:crypto";

const RESPONSE_STATUSES = new Set(["fixed", "rejected_invalid", "accepted_risk"]);
const RESULT_REF = /^reviews\/results\/[A-Za-z0-9._-]+\.json$/;
const OID = /^[a-f0-9]{40,64}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const NON_STRUCTURAL_STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
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
  acceptance: ["acceptance_criteria"], schema: ["schema"],
  structured_context: ["interface", "state"], evidence: ["test_strategy"],
  unknown: ["direction"], explanation: [],
});

function nonEmpty(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`);
  return value;
}

function oid(value, label) {
  if (typeof value !== "string" || !OID.test(value)) throw new TypeError(`${label} must be a Git tree OID`);
  return value;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function responseLedger(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== "wh-review-response-ledger.v1") throw new TypeError("response_ledger must be wh-review-response-ledger.v1");
  if (!RESULT_REF.test(value.previous_result_ref ?? "")) throw new TypeError("response_ledger.previous_result_ref must be a canonical review result ref");
  oid(value.previous_snapshot_tree, "response_ledger.previous_snapshot_tree");
  oid(value.current_snapshot_tree, "response_ledger.current_snapshot_tree");
  if (!Array.isArray(value.responses)) throw new TypeError("response_ledger.responses must be an array");
  const seen = new Set();
  const responses = value.responses.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new TypeError(`response_ledger.responses[${index}] must be an object`);
    const findingId = nonEmpty(entry.finding_id, `response_ledger.responses[${index}].finding_id`);
    if (!/^F-[a-f0-9]{12}$/.test(findingId) || seen.has(findingId)) throw new TypeError("response_ledger finding ids must be unique canonical IDs");
    seen.add(findingId);
    if (!RESPONSE_STATUSES.has(entry.status)) throw new TypeError("response_ledger response status is invalid");
    nonEmpty(entry.rationale, `response_ledger.responses[${index}].rationale`);
    if (!Array.isArray(entry.changed_dimensions) || entry.changed_dimensions.some((dimension) => !MATERIAL_CHANGE_DIMENSIONS.has(dimension))) {
      throw new TypeError("response_ledger.changed_dimensions is invalid");
    }
    if (!Array.isArray(entry.evidence_refs) || entry.evidence_refs.some((ref) => typeof ref !== "string" || !/^(?:receipts|reviews\/results|evidence)\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(ref))) {
      throw new TypeError("response_ledger.evidence_refs is invalid");
    }
    if (entry.status === "accepted_risk") {
      nonEmpty(entry.accepted_snapshot_tree, "accepted-risk accepted_snapshot_tree");
      if (!Array.isArray(entry.affected_paths) || entry.affected_paths.length === 0 || entry.affected_paths.some((path) => typeof path !== "string" || path.startsWith("/") || path.includes(".."))) {
        throw new TypeError("accepted-risk affected_paths is invalid");
      }
    }
    return {
      finding_id: findingId, status: entry.status, rationale: entry.rationale,
      changed_dimensions: [...entry.changed_dimensions], evidence_refs: [...entry.evidence_refs],
      ...(entry.replay === undefined ? {} : { replay: entry.replay }),
      ...(entry.status === "accepted_risk" ? { accepted_snapshot_tree: entry.accepted_snapshot_tree, affected_paths: [...entry.affected_paths] } : {}),
    };
  });
  let change;
  if (value.change !== undefined) {
    if (!value.change || typeof value.change !== "object" || Array.isArray(value.change)) {
      throw new TypeError("response_ledger.change must be an object");
    }
    if (!Array.isArray(value.change.changed_dimensions)
        || value.change.changed_dimensions.some((dimension) => !MATERIAL_CHANGE_DIMENSIONS.has(dimension))) {
      throw new TypeError("response_ledger.change.changed_dimensions is invalid");
    }
    nonEmpty(value.change.rationale, "response_ledger.change.rationale");
    if (!Array.isArray(value.change.evidence_refs)
        || value.change.evidence_refs.some((ref) => typeof ref !== "string"
          || !/^(?:receipts|reviews\/results|evidence)\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(ref))) {
      throw new TypeError("response_ledger.change.evidence_refs is invalid");
    }
    change = {
      changed_dimensions: [...value.change.changed_dimensions],
      rationale: value.change.rationale,
      evidence_refs: [...value.change.evidence_refs],
    };
  }
  let machineClassification;
  if (value.change_classification !== undefined) {
    const candidate = value.change_classification;
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)
        || candidate.version !== CHANGE_CLASSIFICATION_VERSION || candidate.source !== "frozen_bundle_manifest"
        || candidate.previous_snapshot_tree !== value.previous_snapshot_tree
        || candidate.current_snapshot_tree !== value.current_snapshot_tree
        || !SHA256.test(candidate.source_diff_sha256 ?? "")
        || typeof candidate.structural !== "boolean"
        || !Array.isArray(candidate.changed_dimensions)
        || candidate.changed_dimensions.some((dimension) => !MATERIAL_CHANGE_DIMENSIONS.has(dimension))
        || candidate.structural !== (candidate.changed_dimensions.length > 0)) {
      throw new TypeError("response_ledger.change_classification is invalid or unbound");
    }
    machineClassification = {
      version: candidate.version, source: candidate.source,
      previous_snapshot_tree: candidate.previous_snapshot_tree,
      current_snapshot_tree: candidate.current_snapshot_tree,
      source_diff_sha256: candidate.source_diff_sha256,
      previous_manifest: candidate.previous_manifest,
      current_manifest: candidate.current_manifest,
      changed_dimensions: [...candidate.changed_dimensions],
      structural: candidate.structural,
    };
  }
  return {
    version: value.version,
    previous_result_ref: value.previous_result_ref,
    previous_snapshot_tree: value.previous_snapshot_tree,
    current_snapshot_tree: value.current_snapshot_tree,
    ...(change === undefined ? {} : { change }),
    ...(machineClassification === undefined ? {} : { change_classification: machineClassification }),
    responses,
  };
}

function actionableFindingIds(result) {
  if (!result?.adjudication || !Array.isArray(result.adjudication.clusters)) return null;
  return result.adjudication.clusters.filter(({ disposition }) => disposition === "actionable").map(({ id }) => id).sort();
}

function trustedReplay(previousResult, previousAttempt, entry) {
  if (entry.replay === undefined) return;
  const mismatch = (message) => { throw new TypeError(`REPLAY_MISMATCH: ${message}`); };
  if (!entry.replay || typeof entry.replay !== "object" || Array.isArray(entry.replay)) {
    mismatch("replay binding must be an object");
  }
  if (!previousAttempt || previousAttempt.task_id !== previousResult.task_id
      || previousAttempt.stage !== previousResult.stage
      || previousAttempt.review_track !== previousResult.review_track
      || previousAttempt.terminal_status !== "semantic") {
    mismatch("trusted prior attempt/result binding is missing");
  }
  const profiles = previousAttempt.review_policy?.requested_profiles
    ?? [...new Set((previousAttempt.provider_attempts ?? []).map(({ provider }) => provider))];
  const cluster = previousResult.adjudication?.clusters?.find(({ id }) => id === entry.finding_id);
  const anchorValid = (cluster?.provider_findings ?? []).length > 0
    && cluster.provider_findings.every(({ evidence_anchor_valid: valid }) => valid === true);
  if (entry.replay.previous_result_ref !== previousResult.result_ref
      || entry.replay.finding_id !== entry.finding_id
      || canonicalJson(entry.replay.requested_profiles) !== canonicalJson(profiles)
      || entry.replay.evidence_anchor_valid !== anchorValid) {
    mismatch("request differs from authenticated prior review evidence");
  }
}

function boundActionableLedger(previousResult, ledger, currentSnapshotTree, previousAttempt = null) {
  const checked = responseLedger(ledger);
  const actionable = actionableFindingIds(previousResult);
  if (actionable === null) throw new TypeError("response_ledger requires a v2-adjudicated previous result");
  if (checked.previous_result_ref !== previousResult.result_ref || checked.previous_snapshot_tree !== previousResult.snapshot_tree ||
      currentSnapshotTree === null || checked.current_snapshot_tree !== currentSnapshotTree) {
    throw new TypeError("response_ledger does not bind the previous result and frozen review snapshot");
  }
  if (!checked.responses.every(({ finding_id }) => actionable.includes(finding_id)) || checked.responses.length !== actionable.length) {
    throw new TypeError("response_ledger must resolve every and only actionable finding");
  }
  checked.responses.forEach((entry) => trustedReplay(previousResult, previousAttempt, entry));
  return checked;
}

function changeClassification(value, previousResult, currentSnapshotTree) {
  if (value === null || value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)
      || value.version !== CHANGE_CLASSIFICATION_VERSION
      || value.source !== "frozen_bundle_manifest"
      || value.previous_snapshot_tree !== previousResult.snapshot_tree
      || value.current_snapshot_tree !== currentSnapshotTree
      || !SHA256.test(value.source_diff_sha256 ?? "")
      || typeof value.structural !== "boolean"
      || !Array.isArray(value.changed_dimensions)
      || value.changed_dimensions.some((dimension) => !MATERIAL_CHANGE_DIMENSIONS.has(dimension))
      || value.structural !== (value.changed_dimensions.length > 0)) {
    throw new TypeError("machine change classification is invalid or unbound");
  }
  const recomputed = deriveChangeClassification({
    previousSnapshotTree: value.previous_snapshot_tree,
    currentSnapshotTree: value.current_snapshot_tree,
    previousManifest: value.previous_manifest,
    currentManifest: value.current_manifest,
  });
  if (canonicalJson(recomputed) !== canonicalJson(value)) throw new TypeError("machine change classification is not reproducible");
  return value;
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
  const changedDimensions = [...new Set([...changedCategories].flatMap((category) =>
    CATEGORY_DIMENSIONS[category] ?? CATEGORY_DIMENSIONS.unknown))].sort();
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

function resolutionState(previousResult, ledger, currentSnapshotTree, machineClassification = null, previousAttempt = null) {
  const checked = boundActionableLedger(previousResult, ledger, currentSnapshotTree, previousAttempt);
  const classification = changeClassification(machineClassification ?? checked.change_classification ?? null, previousResult, currentSnapshotTree);
  const hasStructuralChange = classification?.structural ?? (
    (checked.change?.changed_dimensions.length ?? 0) > 0
      || checked.responses.some(({ changed_dimensions }) => changed_dimensions.length > 0)
  );
  const hasRejectedFinding = checked.responses.some(({ status }) => status === "rejected_invalid");
  const expiredRisk = checked.responses.some((entry) => entry.status === "accepted_risk" && entry.accepted_snapshot_tree !== currentSnapshotTree);
  return { checked, classification, hasStructuralChange, hasRejectedFinding, expiredRisk };
}

export function responseLedgerSha256(ledger) {
  return createHash("sha256").update(canonicalJson(responseLedger(ledger))).digest("hex");
}

/**
 * Non-code stages retain review findings as quality facts. A response ledger
 * is useful audit evidence, never a pass gate: absent or invalid evidence is
 * recorded as unverified instead of blocking the stage or claiming a repair.
 */
export function buildNonGateReviewResponseRecord({ taskId, stage, reviewTrack = null, previousResult, previousAttempt = null, previousResultSha256, ledger = null, currentSnapshotTree, changeClassification: machineClassification = null } = {}) {
  if (typeof taskId !== "string" || taskId.trim() === "") throw new TypeError("resolution taskId must be non-empty");
  if (!NON_STRUCTURAL_STAGES.has(stage)) throw new TypeError("non-gate review response is not allowed for this stage");
  if (stage === "make-decision") {
    if (!["direction", "detail"].includes(reviewTrack)) throw new TypeError("make-decision resolution requires direction or detail review_track");
  } else if (reviewTrack !== null) throw new TypeError("non-gate review response review_track must be null");
  if (!SHA256.test(previousResultSha256 ?? "")) throw new TypeError("resolution previousResultSha256 must be sha256");
  const base = {
    version: "wh-review-resolution.v1",
    task_id: taskId,
    stage,
    review_track: reviewTrack,
    outcome: "recorded_non_gate_response",
    previous_verdict: previousResult.verdict,
    provider_calls: 0,
    previous_result_ref: previousResult.result_ref,
    previous_result_sha256: previousResultSha256,
    previous_snapshot_tree: previousResult.snapshot_tree,
    snapshot_tree: currentSnapshotTree,
  };
  const assertedClassification = changeClassification(machineClassification, previousResult, currentSnapshotTree);
  try {
    const state = resolutionState(previousResult, ledger, currentSnapshotTree, machineClassification, previousAttempt);
    return {
      ...base, evidence_state: "verified", response_ledger: state.checked,
      response_ledger_sha256: responseLedgerSha256(state.checked), unverified_reason: null,
      accepted_risk_count: state.checked.responses.filter(({ status }) => status === "accepted_risk").length,
      ...(state.classification ? { change_classification: state.classification } : {}),
    };
  } catch (error) {
    if (error.message?.startsWith("REPLAY_MISMATCH:")) {
      error.code = "REPLAY_MISMATCH";
      throw error;
    }
    if (assertedClassification?.structural) {
      throw new Error(`structural change requires a complete bound response ledger: ${error.message}`);
    }
    return {
      ...base, evidence_state: "unverified", response_ledger: null,
      response_ledger_sha256: null, unverified_reason: ledger === null ? "no_response_ledger" : "ledger_invalid_or_unbound",
      accepted_risk_count: 0,
    };
  }
}

function reviewChainRoot(result) {
  const root = result?.review_chain?.root_result_ref;
  return typeof root === "string" && RESULT_REF.test(root) ? root : result?.result_ref;
}

export function buildReviewChain({ previousResult = null, ledger = null, currentSnapshotTree, round = "initial" } = {}) {
  if (!OID.test(currentSnapshotTree ?? "")) throw new TypeError("currentSnapshotTree must be a Git tree OID");
  if (!new Set(["initial", "closure", "full", "legacy"]).has(round)) throw new TypeError("review chain round is invalid");
  if (previousResult === null) {
    if (ledger !== null) throw new TypeError("response_ledger requires a canonical previous result");
    return {
      version: "wh-review-chain.v1", round,
      parent_result_ref: null, root_result_ref: null, prior_snapshot_tree: null,
      current_snapshot_tree: currentSnapshotTree, response_ledger_sha256: null,
    };
  }
  if (!RESULT_REF.test(previousResult.result_ref ?? "") || !OID.test(previousResult.snapshot_tree ?? "")) {
    throw new TypeError("previous result has no canonical chain identity");
  }
  if (round === "closure" || ledger !== null) {
    const checked = responseLedger(ledger);
    if (checked.previous_result_ref !== previousResult.result_ref) throw new TypeError("response_ledger previous_result_ref must match previous result");
    if (checked.previous_snapshot_tree !== previousResult.snapshot_tree) throw new TypeError("response_ledger previous_snapshot_tree must match previous result");
    if (checked.current_snapshot_tree !== currentSnapshotTree) throw new TypeError("response_ledger current_snapshot_tree must match the frozen review snapshot");
    return {
      version: "wh-review-chain.v1", round,
      parent_result_ref: previousResult.result_ref, root_result_ref: reviewChainRoot(previousResult),
      prior_snapshot_tree: previousResult.snapshot_tree, current_snapshot_tree: currentSnapshotTree,
      response_ledger_sha256: createHash("sha256").update(canonicalJson(checked)).digest("hex"),
    };
  }
  return {
    version: "wh-review-chain.v1", round,
    parent_result_ref: previousResult.result_ref, root_result_ref: reviewChainRoot(previousResult),
    prior_snapshot_tree: previousResult.snapshot_tree, current_snapshot_tree: currentSnapshotTree,
    response_ledger_sha256: null,
  };
}

export function selectReviewRound({ stage, route, previousResult = null, ledger = null, closureFailures = 0, structuralFullAlreadyRecorded = false, currentSnapshotTree = null, changeClassification: machineClassification = null } = {}) {
  if (!["make-decision", "build-spec", "build-plan", "build-code", "verify-code"].includes(stage)) throw new TypeError("stage is invalid");
  if (!route || typeof route !== "object") return { round: "legacy", reason: "legacy_3rd_review" };
  if (!Number.isSafeInteger(closureFailures) || closureFailures < 0) throw new TypeError("review progress counters are invalid");
  if (typeof structuralFullAlreadyRecorded !== "boolean") throw new TypeError("structural full-review audit flag is invalid");
  if (route.mode === "single_round") {
    if (previousResult === null) return { round: "initial", reason: "single_round" };
    if (!["pass", "revise_required"].includes(previousResult.verdict)) {
      throw new TypeError("previous result must be semantic");
    }
    if (previousResult.verdict === "pass"
        && previousResult.snapshot_tree === currentSnapshotTree
        && ledger === null) {
      return { round: "none", reason: "single_round_already_completed" };
    }
    // single_round never turns a provider finding into a review loop or a
    // stage gate. A changed final snapshot is bound through a zero-provider
    // resolution for either semantic verdict; the verdict itself never moves.
    return { round: "none", reason: "review_non_gate_recorded" };
  }
  if (previousResult === null) return { round: "initial", reason: "first_review" };
  if (stage === "build-code" || route.mode === "full_only") {
    if (!["pass", "revise_required"].includes(previousResult.verdict)) {
      throw new TypeError("previous result must be semantic");
    }
    // One frozen Phase identity receives one complete provider review. A
    // repair creates a new snapshot-scoped identity and therefore a fresh
    // initial review; the old quality verdict is never chased to `pass`.
    return { round: "none", reason: "phase_quality_fact_recorded" };
  }
  if (route.mode === "full_on_structural_rework") {
    if (!["pass", "revise_required"].includes(previousResult.verdict)) throw new TypeError("previous result must be semantic");
    let state = null;
    try { state = resolutionState(previousResult, ledger, currentSnapshotTree, machineClassification); }
    catch (error) {
      if (machineClassification?.structural) {
        throw new Error(`structural change requires a complete bound response ledger: ${error.message}`);
      }
      /* Response evidence is optional quality data, never a gate. */
    }
    if (state?.hasStructuralChange) {
      if (structuralFullAlreadyRecorded || previousResult.review_chain?.round === "full") {
        return { round: "none", reason: "post_full_non_gate_recorded" };
      }
      // Record the authenticated structural resolution first. TaskKernel then
      // opens a fresh generation; the next invocation naturally starts at an
      // initial review instead of mutating this accepted history in place.
      return { round: "none", reason: "review_non_gate_recorded" };
    }
    return { round: "none", reason: "review_non_gate_recorded" };
  }
  if (previousResult.verdict === "pass") return { round: "none", reason: "prior_result_passed" };
  if (previousResult.verdict !== "revise_required") throw new TypeError("previous result must be semantic");
  let state;
  try { state = resolutionState(previousResult, ledger, currentSnapshotTree); }
  catch (error) {
    if (String(error?.message).includes("v2-adjudicated")) return { round: "full", reason: "prior_result_has_no_v2_adjudication" };
    throw error;
  }
  if (state.hasStructuralChange || state.expiredRisk || closureFailures >= 2) {
    return { round: "full", reason: state.hasStructuralChange ? "material_change" : state.expiredRisk ? "accepted_risk_expired" : "closure_failed_twice" };
  }
  if (!Array.isArray(route.closure) || route.closure.length === 0) return { round: "full", reason: "no_closure_route" };
  return { round: "closure", reason: "bounded_non_material_response_ledger" };
}

export { responseLedger as validateResponseLedger };
