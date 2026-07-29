import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { assertTaskHandle } from "../../../core/task-handle.mjs";
import { deriveSeriousReviewPause, validateRiskAcceptanceSet } from "../../../core/stage-review-disposition.mjs";
import { validateSchema } from "./schema-validator.mjs";
import { readPhaseMapTrace } from "./phase-review-subject.mjs";

const OID = /^[a-f0-9]{40,64}$/;
const HASH = /^[a-f0-9]{64}$/;
const PHASE = /^[A-Za-z0-9._-]+$/;
const PHASE_REVIEW_RESULT_REF = /^reviews\/results\/[A-Za-z0-9._-]+\.json$/;
const LINEAGE_KEYS = new Set([
  "schema_version", "project_name", "task_id", "stage", "phase_id", "snapshot_tree", "trace",
  "phase_evidence", "diff_scan", "implementation_receipt", "green_test_receipt", "red_test_receipt",
  "review_result", "review_attempt", "material_id", "created_at", "result",
  "risk_acceptances",
]);
const SUPERSESSION_KEYS = new Set([...LINEAGE_KEYS, "supersedes"]);

function incomplete(message) {
  const error = new Error(`MATERIAL_INCOMPLETE: ${message}`);
  error.code = "MATERIAL_INCOMPLETE";
  throw error;
}

function readJson(task, ref, label) {
  let raw;
  try { raw = task.readRecord(ref); }
  catch { incomplete(`${label} is missing: ${ref}`); }
  try { return { raw, value: JSON.parse(raw), sha256: createHash("sha256").update(raw).digest("hex") }; }
  catch { incomplete(`${label} is not JSON: ${ref}`); }
}

function git(root, args, label) {
  try { return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  catch { incomplete(`${label} is unavailable from Git`); }
}

function checkpoint(task, sourceRoot) {
  const record = readJson(task, "results/build-plan/accepted.json", "accepted build-plan").value;
  const value = record?.stage === "build-plan" ? record.checkpoint : null;
  if (!value || typeof value !== "object" || !OID.test(value.commit_oid ?? "") || !OID.test(value.tree_oid ?? "")) {
    incomplete("accepted build-plan checkpoint is invalid");
  }
  const tree = git(sourceRoot, ["rev-parse", `${value.commit_oid}^{tree}`], "accepted build-plan checkpoint");
  if (tree !== value.tree_oid) incomplete("accepted build-plan checkpoint tree does not match its commit");
  return Object.freeze({ commit: value.commit_oid, tree: value.tree_oid, ref: value.ref ?? null });
}

function phaseTrace(task, sourceRoot, ref) {
  try { return readPhaseMapTrace({ task, sourceRoot, traceRef: ref }); }
  catch (error) { incomplete(`canonical Phase trace is invalid: ${ref}: ${error.message}`); }
}

function binding(value, label, { nullable = false } = {}) {
  if (nullable && value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).some((key) => key !== "ref" && key !== "sha256")
    || typeof value.ref !== "string" || value.ref.length === 0 || !HASH.test(value.sha256 ?? "")) {
    incomplete(`Phase trace lineage ${label} binding is invalid`);
  }
  return Object.freeze({ ref: value.ref, sha256: value.sha256 });
}

function sameBinding(actual, expected) {
  return actual?.ref === expected?.ref && actual?.sha256 === expected?.sha256;
}

function verifiedRiskAcceptances(task, lineage, trace, label) {
  const reviewStatus = trace.trace.review_status
    ?? (trace.review === null ? "unavailable" : "semantic");
  if (trace.review === null || reviewStatus !== "semantic") {
    incomplete(`Phase trace lineage ${label} supports semantic review results only; unavailable attempts stay bound by their canonical current Phase trace`);
  }
  const supplied = lineage.risk_acceptances ?? [];
  if (!Array.isArray(supplied)) incomplete(`Phase trace lineage ${label} risk acceptances are invalid`);
  const records = supplied.map((value) => {
    const accepted = binding(value, `${label} risk acceptance`);
    const match = /^evidence\/risk-acceptances\/([a-f0-9]{64})\.json$/.exec(accepted.ref);
    if (!match || match[1] !== accepted.sha256) incomplete(`Phase trace lineage ${label} risk acceptance is not content-addressed`);
    const record = readJson(task, accepted.ref, `${label} risk acceptance`);
    if (record.sha256 !== accepted.sha256) incomplete(`Phase trace lineage ${label} risk acceptance hash mismatch`);
    return { binding: accepted, value: record.value };
  });
  const reviewHash = trace.review.sha256 ?? trace.review.hash;
  const preliminary = deriveSeriousReviewPause({
    taskId: task.identity.taskId,
    stage: "build-code",
    reviewRef: trace.review.ref,
    reviewHash,
    result: trace.review.value,
  });
  if (preliminary.status !== "paused") {
    if (records.length) incomplete(`Phase trace lineage ${label} has a risk override without actionable serious findings`);
    return;
  }
  if (records.length === 0) incomplete(`Phase trace lineage ${label} leaves actionable serious findings unresolved`);
  const workflowRunIds = new Set(records.map(({ value }) => value?.workflow_run_id));
  const workflowRunId = [...workflowRunIds][0];
  if (workflowRunIds.size !== 1 || typeof workflowRunId !== "string" || workflowRunId.trim() === "") {
    incomplete(`Phase trace lineage ${label} risk acceptances do not bind one review run`);
  }
  const pause = deriveSeriousReviewPause({
    taskId: task.identity.taskId,
    stage: "build-code",
    reviewRef: trace.review.ref,
    reviewHash,
    result: trace.review.value,
    workflowRunId,
  });
  try { validateRiskAcceptanceSet({ acceptances: records.map(({ value }) => value), pause }); }
  catch (error) { incomplete(`Phase trace lineage ${label} risk acceptance is invalid: ${error.message}`); }
  for (const { value } of records) {
    const finding = pause.findings.find(({ finding_id: findingId }) => findingId === value.finding_id);
    let cardRaw; let replyRaw;
    try {
      cardRaw = task.readRecord(value.card_ref);
      replyRaw = task.readRecord(value.reply_ref);
    } catch {
      incomplete(`Phase trace lineage ${label} risk acceptance card or reply is missing`);
    }
    if (cardRaw !== `${JSON.stringify(finding, null, 2)}\n`
      || createHash("sha256").update(replyRaw).digest("hex") !== value.reply_hash) {
      incomplete(`Phase trace lineage ${label} risk acceptance does not bind canonical card and reply bytes`);
    }
  }
}

function legacyRefOnly(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== 1 || value.ref !== expected.ref) {
    incomplete(`legacy Phase trace lineage ${label} is not the known missing-hash shape`);
  }
}

function verifiedSupersessions({ task, sourceRoot, readTrace }) {
  const refs = typeof task.listCanonicalPhaseTraceLineageSupersessionRefs === "function"
    ? task.listCanonicalPhaseTraceLineageSupersessionRefs() : [];
  const byLegacyRef = new Map();
  const reviewRefs = new Set();
  for (const ref of refs) {
    const correction = readJson(task, ref, "Phase trace lineage supersession");
    const value = correction.value;
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((key) => !SUPERSESSION_KEYS.has(key))
      || value.schema_version !== "phase-trace-lineage-supersession.v1" || value.project_name !== task.identity.projectName
      || value.task_id !== task.identity.taskId || value.stage !== "build-code" || !PHASE.test(value.phase_id ?? "")
      || !OID.test(value.snapshot_tree ?? "") || !HASH.test(value.material_id ?? "") || value.result !== "superseded"
      || !Number.isFinite(Date.parse(value.created_at ?? ""))) incomplete(`Phase trace lineage supersession is invalid: ${ref}`);
    const supersedes = binding(value.supersedes, "superseded legacy lineage");
    const expectedRef = `identity/phase-trace-lineage-supersessions/${value.phase_id}-${value.snapshot_tree}-${supersedes.sha256}.json`;
    if (ref !== expectedRef || byLegacyRef.has(supersedes.ref)) incomplete(`Phase trace lineage supersession duplicate or name mismatch: ${ref}`);
    const legacy = readJson(task, supersedes.ref, "superseded legacy lineage");
    const old = legacy.value;
    if (!old || typeof old !== "object" || Array.isArray(old) || Object.keys(old).some((key) => !LINEAGE_KEYS.has(key))
      || old.schema_version !== "phase-trace-lineage-generation.v1" || old.project_name !== value.project_name || old.task_id !== value.task_id
      || old.stage !== value.stage || old.phase_id !== value.phase_id || old.snapshot_tree !== value.snapshot_tree
      || old.material_id !== value.material_id || old.result !== "bound" || !Number.isFinite(Date.parse(old.created_at ?? ""))
      || legacy.sha256 !== supersedes.sha256 || !sameBinding(old.trace, value.trace) || old.red_test_receipt !== null || value.red_test_receipt !== null) {
      incomplete(`Phase trace lineage supersession does not bind the exact legacy record: ${ref}`);
    }
    const expected = {
      phase_evidence: binding(value.phase_evidence, "supersession phase evidence"),
      diff_scan: binding(value.diff_scan, "supersession diff scan"),
      implementation_receipt: binding(value.implementation_receipt, "supersession implementation receipt"),
      green_test_receipt: binding(value.green_test_receipt, "supersession GREEN test receipt"),
      review_result: binding(value.review_result, "supersession review result"),
      review_attempt: binding(value.review_attempt, "supersession review attempt"),
    };
    legacyRefOnly(old.phase_evidence, expected.phase_evidence, "phase evidence");
    legacyRefOnly(old.diff_scan, expected.diff_scan, "diff scan");
    legacyRefOnly(old.implementation_receipt, expected.implementation_receipt, "implementation receipt");
    legacyRefOnly(old.green_test_receipt, expected.green_test_receipt, "GREEN test receipt");
    legacyRefOnly(old.review_result, expected.review_result, "review result");
    legacyRefOnly(old.review_attempt, expected.review_attempt, "review attempt");
    const traceBinding = binding(value.trace, "supersession trace");
    const trace = readTrace(task, sourceRoot, traceBinding.ref);
    if (trace.traceSha256 !== traceBinding.sha256 || trace.trace.phase_id !== value.phase_id
      || trace.trace.snapshot_tree !== value.snapshot_tree || trace.trace.material_id !== value.material_id
      || !["pass", "revise_required"].includes(trace.trace.verdict)
      || trace.review.value.verdict !== trace.trace.verdict
      || !sameBinding(trace.trace.canonical_phase_evidence, expected.phase_evidence)
      || !sameBinding(trace.trace.diff_scan, expected.diff_scan)
      || !sameBinding(trace.trace.implementation_receipt, expected.implementation_receipt)
      || !sameBinding(trace.trace.green_test_receipt, expected.green_test_receipt)
      || !sameBinding(trace.trace.review_result, expected.review_result)
      || !sameBinding(trace.trace.review_attempt, expected.review_attempt)) {
      incomplete(`Phase trace lineage supersession facts do not match its canonical trace: ${ref}`);
    }
    verifiedRiskAcceptances(task, value, trace, `supersession ${ref}`);
    if (reviewRefs.has(expected.review_result.ref)) incomplete(`Phase trace lineage supersession duplicates a formal review binding: ${ref}`);
    reviewRefs.add(expected.review_result.ref);
    byLegacyRef.set(supersedes.ref, value);
  }
  return byLegacyRef;
}

/**
 * A lineage record never participates in path construction. It can only prove
 * that a historical formal Phase review (which shares a covered tree) was already
 * bound to one canonical Phase trace. Any malformed or duplicate binding
 * blocks integration instead of widening the legacy fallback.
 */
export function verifiedHistoricalLineage({ task, sourceRoot, readTrace = phaseTrace } = {}) {
  if (!task || typeof task !== "object") throw new TypeError("task is required");
  if (typeof sourceRoot !== "string" || sourceRoot.length === 0) throw new TypeError("sourceRoot is required");
  if (typeof readTrace !== "function") throw new TypeError("readTrace is required");
  const boundReviews = new Map();
  const supersessions = verifiedSupersessions({ task, sourceRoot, readTrace });
  for (const ref of task.listCanonicalPhaseTraceLineageRefs()) {
    const original = readJson(task, ref, "Phase trace lineage").value;
    const supersession = supersessions.get(ref);
    const { supersedes: ignoredSupersedes, ...supersededLineage } = supersession ?? {};
    const lineage = supersession ? { ...supersededLineage, schema_version: "phase-trace-lineage-generation.v1", result: "bound" } : original;
    if (!lineage || typeof lineage !== "object" || Array.isArray(lineage)
      || Object.keys(lineage).some((key) => !LINEAGE_KEYS.has(key))
      || lineage.schema_version !== "phase-trace-lineage-generation.v1"
      || lineage.project_name !== task.identity.projectName || lineage.task_id !== task.identity.taskId
      || lineage.stage !== "build-code" || !PHASE.test(lineage.phase_id ?? "")
      || !OID.test(lineage.snapshot_tree ?? "") || !HASH.test(lineage.material_id ?? "")
      || lineage.result !== "bound" || !Number.isFinite(Date.parse(lineage.created_at ?? ""))) {
      incomplete(`Phase trace lineage is invalid: ${ref}`);
    }
    const traceBinding = binding(lineage.trace, "trace");
    const expectedRef = `identity/phase-trace-lineage/${lineage.phase_id}-${lineage.snapshot_tree}-${traceBinding.sha256}.json`;
    if (ref !== expectedRef) incomplete(`Phase trace lineage record name does not bind its facts: ${ref}`);
    const expected = {
      canonical_phase_evidence: binding(lineage.phase_evidence, "phase evidence"),
      diff_scan: binding(lineage.diff_scan, "diff scan"),
      implementation_receipt: binding(lineage.implementation_receipt, "implementation receipt"),
      green_test_receipt: binding(lineage.green_test_receipt, "green test receipt"),
      red_test_receipt: binding(lineage.red_test_receipt, "red test receipt", { nullable: true }),
      review_result: binding(lineage.review_result, "review result"),
      review_attempt: binding(lineage.review_attempt, "review attempt"),
    };
    const trace = readTrace(task, sourceRoot, traceBinding.ref);
    const actual = trace.trace;
    if (trace.traceSha256 !== traceBinding.sha256 || actual.phase_id !== lineage.phase_id
      || actual.snapshot_tree !== lineage.snapshot_tree || actual.material_id !== lineage.material_id
      || !["pass", "revise_required"].includes(actual.verdict)
      || trace.review.value.verdict !== actual.verdict
      || !sameBinding(actual.canonical_phase_evidence, expected.canonical_phase_evidence)
      || !sameBinding(actual.diff_scan, expected.diff_scan)
      || !sameBinding(actual.implementation_receipt, expected.implementation_receipt)
      || !sameBinding(actual.green_test_receipt, expected.green_test_receipt)
      || !sameBinding(actual.red_test_receipt, expected.red_test_receipt)
      || !sameBinding(actual.review_result, expected.review_result)
      || !sameBinding(actual.review_attempt, expected.review_attempt)) {
      incomplete(`Phase trace lineage facts do not match its canonical trace: ${ref}`);
    }
    verifiedRiskAcceptances(task, lineage, trace, ref);
    if (boundReviews.has(expected.review_result.ref)) {
      incomplete(`Phase trace lineage duplicates a formal review binding: ${expected.review_result.ref}`);
    }
    boundReviews.set(expected.review_result.ref, expected.review_result.sha256);
  }
  return boundReviews;
}

/** Prevalidate legacy sibling-repair records before they can affect trace selection. */
export function prevalidatePhaseReviewCorrections({ task, sourceRoot, readTrace = phaseTrace } = {}) {
  if (!task || typeof task !== "object") throw new TypeError("task is required");
  if (typeof sourceRoot !== "string" || sourceRoot.length === 0) throw new TypeError("sourceRoot is required");
  if (typeof task.listCanonicalPhaseReviewCorrectionRefs !== "function") return new Map();
  const superseded = new Map();
  for (const ref of task.listCanonicalPhaseReviewCorrectionRefs()) {
    const correction = readJson(task, ref, "Phase review correction");
    const value = correction.value;
    const allowed = new Set(["schema_version", "project_name", "task_id", "stage", "phase_id", "base_tree", "supersedes", "replacement", "reason_code", "created_at", "result"]);
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((key) => !allowed.has(key))
      || value.schema_version !== "phase-review-correction.v1" || value.project_name !== task.identity.projectName
      || value.task_id !== task.identity.taskId || value.stage !== "build-code" || !PHASE.test(value.phase_id ?? "")
      || !OID.test(value.base_tree ?? "") || value.reason_code !== "historical_phase_repaired"
      || value.result !== "superseded" || !Number.isFinite(Date.parse(value.created_at ?? ""))) {
      incomplete(`Phase review correction is invalid: ${ref}`);
    }
    const oldBinding = binding(value.supersedes, "superseded Phase review");
    if (!value.replacement || typeof value.replacement !== "object" || Array.isArray(value.replacement)
      || Object.keys(value.replacement).some((key) => !new Set(["ref", "sha256", "snapshot_tree", "trace"]).has(key))) {
      incomplete(`Phase review correction replacement binding is invalid: ${ref}`);
    }
    const replacementBinding = binding({ ref: value.replacement.ref, sha256: value.replacement.sha256 }, "replacement Phase review");
    if (!PHASE_REVIEW_RESULT_REF.test(oldBinding.ref) || !PHASE_REVIEW_RESULT_REF.test(replacementBinding.ref)) incomplete(`Phase review correction review ref is invalid: ${ref}`);
    const oldReview = readJson(task, oldBinding.ref, "superseded Phase review");
    const replacement = readJson(task, replacementBinding.ref, "replacement Phase review");
    try { validateSchema("result", oldReview.value); validateSchema("result", replacement.value); }
    catch (error) { incomplete(`Phase review correction review schema is invalid: ${ref}: ${error.message}`); }
    const oldValue = oldReview.value; const newValue = replacement.value;
    const correctionRef = `identity/phase-review-corrections/phase-${value.phase_id}-${oldValue.candidate_tree}-${newValue.candidate_tree}-${correction.sha256}.json`;
    if (ref !== correctionRef) incomplete(`Phase review correction ref is invalid: ${ref}`);
    const invalidFacts = [
      oldReview.sha256 !== oldBinding.sha256 && "superseded review hash",
      replacement.sha256 !== replacementBinding.sha256 && "replacement review hash",
      oldValue.task_id !== task.identity.taskId && "superseded task",
      newValue.task_id !== task.identity.taskId && "replacement task",
      oldValue.stage !== "build-code" && "superseded stage",
      newValue.stage !== "build-code" && "replacement stage",
      oldValue.subject_kind !== "phase" && "superseded subject",
      newValue.subject_kind !== "phase" && "replacement subject",
      oldValue.review_scope !== "phase" && "superseded scope",
      newValue.review_scope !== "phase" && "replacement scope",
      oldValue.phase_id !== value.phase_id && "superseded phase",
      newValue.phase_id !== value.phase_id && "replacement phase",
      oldValue.base_tree !== value.base_tree && "superseded base",
      newValue.base_tree !== value.base_tree && "replacement base",
      oldValue.verdict !== "revise_required" && "superseded verdict",
      newValue.verdict !== "pass" && "replacement verdict",
      oldValue.candidate_tree === newValue.candidate_tree && "same snapshot",
      value.replacement.snapshot_tree !== newValue.candidate_tree && "replacement snapshot mismatch",
    ].filter(Boolean);
    if (invalidFacts.length) incomplete(`Phase review correction facts do not bind the final Phase path: ${ref}: ${invalidFacts.join(", ")}`);
    const traceBinding = binding(value.replacement.trace, "replacement Phase trace");
    const trace = readTrace(task, sourceRoot, traceBinding.ref);
    if (trace.traceSha256 !== traceBinding.sha256 || trace.trace.phase_id !== value.phase_id
      || trace.trace.base_tree !== value.base_tree || trace.trace.snapshot_tree !== newValue.candidate_tree
      || trace.trace.verdict !== "pass" || trace.review?.ref !== replacementBinding.ref || trace.review?.sha256 !== replacement.sha256) {
      incomplete(`Phase review correction replacement trace mismatch: ${ref}`);
    }
    if (superseded.has(oldBinding.ref) || [...superseded.values()].some((entry) => entry.replacement.ref === replacementBinding.ref)) {
      incomplete(`Phase review correction duplicates a historical review: ${ref}`);
    }
    superseded.set(oldBinding.ref, Object.freeze({
      sha256: oldBinding.sha256,
      supersededSnapshot: oldValue.candidate_tree,
      replacement: replacementBinding,
    }));
  }
  return superseded;
}

/** Verify prevalidated legacy correction records against the selected final path. */
export function verifiedPhaseReviewCorrections({
  task, sourceRoot, coverage, readTrace = phaseTrace, prevalidated,
} = {}) {
  if (!Array.isArray(coverage)) throw new TypeError("coverage is required");
  const corrections = prevalidated ?? prevalidatePhaseReviewCorrections({ task, sourceRoot, readTrace });
  if (!(corrections instanceof Map)) throw new TypeError("prevalidated corrections are required");
  const coveredResults = new Map(coverage.flatMap((phase) => phase.review_result === null ? [] : [[phase.review_result.ref, phase.review_result.sha256]]));
  const coveredTrees = new Set(coverage.flatMap((phase) => [phase.base_tree, phase.snapshot_tree]));
  for (const [ref, correction] of corrections) {
    const invalidFacts = [
      coveredTrees.has(correction.supersededSnapshot) && "superseded snapshot is in path",
      coveredResults.get(correction.replacement.ref) !== correction.replacement.sha256
        && `replacement is not in path (${[...coveredResults.keys()].join(",")})`,
    ].filter(Boolean);
    if (invalidFacts.length) incomplete(`Phase review correction facts do not bind the final Phase path: ${ref}: ${invalidFacts.join(", ")}`);
  }
  return new Map([...corrections].map(([ref, value]) => [ref, value.sha256]));
}

/** Select canonical traces; only an exact prevalidated legacy binding may skip an invalid historical trace. */
export function selectCanonicalPhaseTraces({
  task, sourceRoot, corrections, readTrace = phaseTrace,
} = {}) {
  if (!task || typeof task !== "object") throw new TypeError("task is required");
  if (typeof sourceRoot !== "string" || sourceRoot.length === 0) throw new TypeError("sourceRoot is required");
  if (!(corrections instanceof Map)) throw new TypeError("prevalidated corrections are required");
  return task.listCanonicalPhaseMapTraceRefs().flatMap((ref) => {
    try { return [readTrace(task, sourceRoot, ref)]; }
    catch (error) {
      let trace;
      try { trace = JSON.parse(task.readRecord(ref)); } catch { throw error; }
      const correction = corrections.get(trace?.review_result?.ref);
      if (correction?.sha256 === trace?.review_result?.sha256) return [];
      throw error;
    }
  });
}

function traceCoverage(trace) {
  const reviewAction = trace.review === null ? trace.attempt : trace.review;
  const coverage = {
    phase_id: trace.trace.phase_id,
    baseline_commit: trace.trace.baseline_commit,
    implementation_commit: trace.trace.implementation_commit,
    base_tree: trace.trace.base_tree,
    snapshot_tree: trace.trace.snapshot_tree,
    trace_ref: trace.traceRef,
    trace_sha256: trace.traceSha256,
    canonical_phase_evidence: { ref: trace.trace.canonical_phase_evidence.ref, sha256: trace.trace.canonical_phase_evidence.sha256 },
    diff_scan: { ref: trace.trace.diff_scan.ref, sha256: trace.trace.diff_scan.sha256 },
    implementation_receipt: { ref: trace.trace.implementation_receipt.ref, sha256: trace.trace.implementation_receipt.sha256 },
    green_test_receipt: { ref: trace.trace.green_test_receipt.ref, sha256: trace.trace.green_test_receipt.sha256 },
    review_status: trace.trace.review_status,
    review_action: { ref: reviewAction.ref, sha256: reviewAction.sha256 },
    review_result: trace.trace.review_result === null ? null
      : { ref: trace.trace.review_result.ref, sha256: trace.trace.review_result.sha256 },
    review_attempt: { ref: trace.trace.review_attempt.ref, sha256: trace.trace.review_attempt.sha256 },
    review_verdict: trace.trace.verdict,
    material_id: trace.trace.material_id,
    allowed_files: [...trace.trace.allowed_files],
    changed_files: [...trace.trace.changed_files],
  };
  // The accepted provider packet receives the final aggregated ac_trace, not
  // this Phase-local working fact.  Keep it non-enumerable so phase coverage
  // remains the small, public coverage record promised by the contract.
  Object.defineProperty(coverage, "acceptanceTrace", { value: trace.acceptanceTrace, enumerable: false });
  return Object.freeze(coverage);
}

function possiblePaths(traces, commit, tree, finalTree, seen = new Set()) {
  const key = `${commit}:${tree}`;
  if (seen.has(key)) return [];
  const nextSeen = new Set(seen); nextSeen.add(key);
  const paths = [];
  for (const trace of traces) {
    if (trace.trace.baseline_commit !== commit || trace.trace.base_tree !== tree) continue;
    const coverage = traceCoverage(trace);
    if (coverage.snapshot_tree === finalTree) {
      paths.push([coverage]);
      continue;
    }
    for (const suffix of possiblePaths(traces, coverage.implementation_commit, coverage.snapshot_tree, finalTree, nextSeen)) {
      paths.push([coverage, ...suffix]);
    }
  }
  return paths;
}

export function assertNoUntracedFormalPhase({ task, coverage, lineageReviews, correctionReviews = new Map() } = {}) {
  if (!task || typeof task !== "object") throw new TypeError("task is required");
  if (!Array.isArray(coverage) || !(lineageReviews instanceof Map) || !(correctionReviews instanceof Map)) throw new TypeError("coverage, lineageReviews, and correctionReviews are required");
  const coveredResults = new Set(coverage.flatMap((phase) => phase.review_result === null ? [] : [phase.review_result.ref]));
  const coveredTrees = new Set(coverage.flatMap((phase) => [phase.base_tree, phase.snapshot_tree]));
  for (const ref of task.listCanonicalReviewResultRefs()) {
    const reviewed = readJson(task, ref, "formal review result");
    const record = reviewed.value;
    try { validateSchema("result", record); }
    catch { incomplete(`formal review result schema is invalid: ${ref}`); }
    if (record.stage !== "build-code" || record.subject_kind !== "phase" || record.review_scope !== "phase") continue;
    if (coveredResults.has(ref)) continue;
    if (lineageReviews.get(ref) === reviewed.sha256) continue;
    if (correctionReviews.get(ref) === reviewed.sha256) continue;
    if (coveredTrees.has(record.base_tree) || coveredTrees.has(record.candidate_tree)) {
      incomplete(`formal Phase review has no phase-map trace: ${ref}`);
    }
  }
}

function seamIndex(coverage, finalTree) {
  const entries = [];
  for (let index = 1; index < coverage.length; index += 1) {
    const producer = coverage[index - 1];
    const consumer = coverage[index];
    const shared = producer.changed_files.filter((path) => consumer.changed_files.includes(path));
    entries.push({
      seam_id: `S-${producer.phase_id}-${consumer.phase_id}`,
      producer_phase_id: producer.phase_id,
      consumer_phase_id: consumer.phase_id,
      producer_changed_files: [...producer.changed_files],
      consumer_changed_files: [...consumer.changed_files],
      shared_paths: shared,
      disposition: "unknown",
      reason_code: "TRACE_HAS_PATHS_NOT_SEMANTIC_SEAMS",
      reason: "Canonical phase traces authenticate changed paths and evidence bindings, but do not contain a producer/consumer, schema, state, error/cancel, or cross-phase-test relation declaration.",
    });
  }
  return Object.freeze({ schema_version: "cross-phase-seam-index.v1", snapshot_tree: finalTree, entries: Object.freeze(entries) });
}

function acTrace(coverage, finalTree) {
  const acceptanceIds = [];
  const entries = new Map();
  for (const phase of coverage) {
    const phaseTrace = phase.acceptanceTrace;
    if (phaseTrace === null || phaseTrace === undefined) {
      incomplete(`canonical Phase trace has no AC change/test mapping: ${phase.trace_ref}`);
    }
    for (const acceptanceId of phaseTrace.acceptance_ids) {
      if (!entries.has(acceptanceId)) {
        acceptanceIds.push(acceptanceId);
        entries.set(acceptanceId, { acceptance_criterion_id: acceptanceId, change: [], test: [], evidence: [], anchors: [] });
      }
    }
    for (const entry of phaseTrace.entries) {
      const target = entries.get(entry.acceptance_criterion_id);
      target.change.push(...entry.change.map(({ change_id, path }) => ({ phase_id: phase.phase_id, change_id, path })));
      target.test.push(...entry.test.map(({ receipt_ref, receipt_hash }) => ({ phase_id: phase.phase_id, receipt_ref, receipt_hash })));
      target.evidence.push(
        { phase_id: phase.phase_id, ref: phase.canonical_phase_evidence.ref, sha256: phase.canonical_phase_evidence.sha256 },
        { phase_id: phase.phase_id, ref: phase.implementation_receipt.ref, sha256: phase.implementation_receipt.sha256 },
        { phase_id: phase.phase_id, ref: phase.review_action.ref, sha256: phase.review_action.sha256 },
      );
      target.anchors.push(...entry.anchors.map((anchor) => ({ ...anchor, id: `${phase.phase_id}:${anchor.id}` })));
    }
  }
  if (acceptanceIds.length === 0) incomplete("continuous Phase coverage declares no AC mappings");
  for (const entry of entries.values()) {
    if (entry.change.length === 0 || entry.test.length === 0 || entry.evidence.length === 0 || entry.anchors.length === 0) {
      incomplete(`AC trace is incomplete for ${entry.acceptance_criterion_id}`);
    }
  }
  return Object.freeze({
    schema_version: "ac-change-test-trace.v1", snapshot_tree: finalTree,
    acceptance_ids: Object.freeze(acceptanceIds), entries: Object.freeze([...entries.values()].map((entry) => Object.freeze({
      ...entry, change: Object.freeze(entry.change), test: Object.freeze(entry.test), evidence: Object.freeze(entry.evidence), anchors: Object.freeze(entry.anchors),
    }))),
  });
}

/**
 * Reconstruct the only admissible final integration subject from canonical,
 * append-only Phase traces. It has no legacy pointer fallback and no diff.
 */
export function buildIntegrationReviewSubject({ task, sourceRoot, finalTree } = {}) {
  const safeTask = assertTaskHandle(task);
  if (typeof sourceRoot !== "string" || sourceRoot.length === 0) throw new TypeError("sourceRoot is required");
  if (!OID.test(finalTree ?? "")) throw new TypeError("finalTree is invalid");
  const accepted = checkpoint(safeTask, sourceRoot);
  const corrections = prevalidatePhaseReviewCorrections({ task: safeTask, sourceRoot });
  const traces = selectCanonicalPhaseTraces({
    task: safeTask, sourceRoot, corrections,
  });
  if (traces.length === 0) incomplete("implementation work requires at least one canonical Phase map trace");
  const paths = possiblePaths(traces, accepted.commit, accepted.tree, finalTree);
  if (paths.length === 0) incomplete("no continuous Phase coverage chain reaches the final tree");
  if (paths.length !== 1) incomplete(`Phase coverage is ambiguous: ${paths.length} continuous chains reach the final tree`);
  const coverage = paths[0];
  if (coverage.length === 0) incomplete("zero-Phase coverage is not permitted");
  const correctionReviews = verifiedPhaseReviewCorrections({
    task: safeTask, sourceRoot, coverage, prevalidated: corrections,
  });
  assertNoUntracedFormalPhase({
    task: safeTask, coverage,
    lineageReviews: verifiedHistoricalLineage({ task: safeTask, sourceRoot }),
    correctionReviews,
  });
  return Object.freeze({
    schema_version: "integration-review-subject.v1",
    subject_kind: "worktree",
    review_scope: "integration",
    base_commit: accepted.commit,
    base_tree: accepted.tree,
    snapshot_tree: finalTree,
    phase_coverage: Object.freeze({
      schema_version: "phase-review-coverage.v1",
      checkpoint: { commit: accepted.commit, tree: accepted.tree, ref: accepted.ref },
      snapshot_tree: finalTree,
      phases: Object.freeze(coverage),
    }),
    seam_index: seamIndex(coverage, finalTree),
    ac_trace: acTrace(coverage, finalTree),
  });
}
