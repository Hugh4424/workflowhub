const MATERIAL_CHANGE_DIMENSIONS = new Set([
  "direction", "acceptance_criteria", "interface", "schema", "state", "security",
  "concurrency", "topology", "phase_order", "test_strategy",
]);
import { createHash } from "node:crypto";

const RESPONSE_STATUSES = new Set(["fixed", "rejected_invalid", "accepted_risk"]);
const RESULT_REF = /^reviews\/results\/[A-Za-z0-9._-]+\.json$/;
const OID = /^[a-f0-9]{40,64}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const NON_STRUCTURAL_STAGES = new Set(["build-spec", "build-plan", "verify-code"]);

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
      ...(entry.status === "accepted_risk" ? { accepted_snapshot_tree: entry.accepted_snapshot_tree, affected_paths: [...entry.affected_paths] } : {}),
    };
  });
  return {
    version: value.version,
    previous_result_ref: value.previous_result_ref,
    previous_snapshot_tree: value.previous_snapshot_tree,
    current_snapshot_tree: value.current_snapshot_tree,
    responses,
  };
}

function actionableFindingIds(result) {
  if (!result?.adjudication || !Array.isArray(result.adjudication.clusters)) return null;
  return result.adjudication.clusters.filter(({ disposition }) => disposition === "actionable").map(({ id }) => id).sort();
}

function boundActionableLedger(previousResult, ledger, currentSnapshotTree) {
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
  return checked;
}

function resolutionState(previousResult, ledger, currentSnapshotTree) {
  const checked = boundActionableLedger(previousResult, ledger, currentSnapshotTree);
  const hasStructuralChange = checked.responses.some(({ changed_dimensions }) => changed_dimensions.length > 0);
  const hasRejectedFinding = checked.responses.some(({ status }) => status === "rejected_invalid");
  const expiredRisk = checked.responses.some((entry) => entry.status === "accepted_risk" && entry.accepted_snapshot_tree !== currentSnapshotTree);
  return { checked, hasStructuralChange, hasRejectedFinding, expiredRisk };
}

export function responseLedgerSha256(ledger) {
  return createHash("sha256").update(canonicalJson(responseLedger(ledger))).digest("hex");
}

/**
 * Non-code stages retain review findings as quality facts. A response ledger
 * is useful audit evidence, never a pass gate: absent or invalid evidence is
 * recorded as unverified instead of blocking the stage or claiming a repair.
 */
export function buildNonGateReviewResponseRecord({ taskId, stage, reviewTrack = null, previousResult, previousResultSha256, ledger = null, currentSnapshotTree } = {}) {
  if (typeof taskId !== "string" || taskId.trim() === "") throw new TypeError("resolution taskId must be non-empty");
  if (!NON_STRUCTURAL_STAGES.has(stage)) throw new TypeError("non-gate review response is not allowed for this stage");
  if (reviewTrack !== null) throw new TypeError("non-gate review response review_track must be null");
  if (!SHA256.test(previousResultSha256 ?? "")) throw new TypeError("resolution previousResultSha256 must be sha256");
  const base = {
    version: "wh-review-resolution.v1",
    task_id: taskId,
    stage,
    review_track: reviewTrack,
    outcome: "recorded_non_gate_response",
    previous_result_ref: previousResult.result_ref,
    previous_result_sha256: previousResultSha256,
    previous_snapshot_tree: previousResult.snapshot_tree,
    snapshot_tree: currentSnapshotTree,
  };
  try {
    const state = resolutionState(previousResult, ledger, currentSnapshotTree);
    return {
      ...base, evidence_state: "verified", response_ledger: state.checked,
      response_ledger_sha256: responseLedgerSha256(state.checked), unverified_reason: null,
      accepted_risk_count: state.checked.responses.filter(({ status }) => status === "accepted_risk").length,
    };
  } catch {
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

export function selectReviewRound({ stage, route, previousResult = null, ledger = null, closureFailures = 0, structuralFullAlreadyRecorded = false, currentSnapshotTree = null } = {}) {
  if (!["make-decision", "build-spec", "build-plan", "build-code", "verify-code"].includes(stage)) throw new TypeError("stage is invalid");
  if (!route || typeof route !== "object") return { round: "legacy", reason: "legacy_3rd_review" };
  if (!Number.isSafeInteger(closureFailures) || closureFailures < 0) throw new TypeError("review progress counters are invalid");
  if (typeof structuralFullAlreadyRecorded !== "boolean") throw new TypeError("structural full-review audit flag is invalid");
  if (stage === "make-decision" || route.mode === "single_round") {
    return previousResult === null
      ? { round: "initial", reason: "single_round" }
      : { round: "none", reason: "single_round_already_completed" };
  }
  if (previousResult === null) return { round: "initial", reason: "first_review" };
  if (previousResult.verdict === "pass") return { round: "none", reason: "prior_result_passed" };
  if (previousResult.verdict !== "revise_required") throw new TypeError("previous result must be semantic");
  if (stage === "build-code" || route.mode === "full_only") {
    boundActionableLedger(previousResult, ledger, currentSnapshotTree);
    return { round: "full", reason: "build_code_requires_fresh_full_review" };
  }
  if (route.mode === "full_on_structural_rework") {
    if (structuralFullAlreadyRecorded || previousResult.review_chain?.round === "full") return { round: "none", reason: "structural_rework_already_reviewed" };
    let state = null;
    try { state = resolutionState(previousResult, ledger, currentSnapshotTree); }
    catch { /* Response evidence is optional quality data, never a gate. */ }
    if (state?.hasStructuralChange) {
      return { round: "full", reason: "structural_rework" };
    }
    return { round: "none", reason: "review_non_gate_recorded" };
  }
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
