import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { assertTaskHandle } from "../../../core/task-handle.mjs";
import { resolvePhaseTaskIds, validateTasksOnlyCompletionSeam } from "../../../runtime/stage/stage-content-contracts.mjs";
import { deriveSeriousReviewPause, validateRiskAcceptanceSet } from "../../../runtime/review/stage-review-disposition.mjs";
import { validateSchema } from "./schema-validator.mjs";
import { readPhaseMapTrace } from "./phase-review-subject.mjs";

const OID = /^[a-f0-9]{40,64}$/;
const HASH = /^[a-f0-9]{64}$/;
const PHASE = /^[A-Za-z0-9._-]+$/;
const PHASE_REVIEW_RESULT_REF = /^reviews\/results\/[A-Za-z0-9._-]+\.json$/;
const PHASE_REVIEW_ATTEMPT_REF = /^reviews\/attempts\/[A-Za-z0-9._-]+\/attempt\.json$/;
const PHASE_SUCCESSOR_REF = /^results\/build-code\/revisions\/phase-successor-[0-9]{4}\.json$/;
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

function sameOrderedArray(left, right) {
  return Array.isArray(left) && Array.isArray(right)
    && left.length === right.length && left.every((value, index) => value === right[index]);
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

/**
 * An awaiting-review successor is not a Phase map trace yet.  It is still a
 * real, immutable execution candidate that integration selection must be able
 * to see without treating the old trace as current.  Build a deliberately
 * marked pending node from phase-result plus the successor's bound receipts;
 * no review fact is invented and buildIntegrationReviewSubject will keep the
 * subject unavailable until the successor receives its own Phase review.
 */
function awaitingSuccessorCandidate({ task, sourceRoot, successorRef, successor, predecessor, successorRecord }) {
  const phaseResult = readJson(task, "phase-result.json", "current Phase result").value;
  if (phaseResult?.status !== "awaiting_review"
    || phaseResult.phase_id !== successor.phase_id
    || phaseResult.phase_successor_ref !== successorRef
    || phaseResult.phase_successor_hash !== successorRecord.sha256) {
    incomplete(`awaiting Phase successor is not the current Phase pointer: ${successorRef}`);
  }
  const currentMaterial = readJson(task, "materials/current.json", "current material revision").value;
  if (currentMaterial?.task_id !== task.identity.taskId
    || currentMaterial.revision_hash !== successor.material_revision_hash
    || typeof currentMaterial.revision_ref !== "string") {
    incomplete(`awaiting Phase successor material binding is stale: ${successorRef}`);
  }
  const evidence = phaseResult.evidence;
  const scanRef = phaseResult.diff_scan?.path;
  const implementationRef = evidence?.implementation_receipt_ref;
  const greenRef = evidence?.green_test_receipt_ref;
  const canonicalEvidenceRef = evidence?.canonical_phase_evidence_ref;
  if (![scanRef, implementationRef, greenRef, canonicalEvidenceRef].every((ref) => typeof ref === "string" && ref.length > 0)) {
    incomplete(`awaiting Phase successor is missing current evidence bindings: ${successorRef}`);
  }
  if (implementationRef !== successor.implementation_receipt_ref || greenRef !== successor.green_test_receipt_ref) {
    incomplete(`awaiting Phase successor receipt bindings do not match the current Phase: ${successorRef}`);
  }
  const scan = readJson(task, scanRef, "awaiting Phase diff scan");
  const implementation = readJson(task, implementationRef, "awaiting Phase implementation receipt");
  const green = readJson(task, greenRef, "awaiting Phase GREEN receipt");
  const canonicalEvidence = readJson(task, canonicalEvidenceRef, "awaiting Phase evidence");
  if (implementation.sha256 !== successor.implementation_receipt_hash
    || green.sha256 !== successor.green_test_receipt_hash
    || canonicalEvidence.value?.phase_id !== successor.phase_id
    || canonicalEvidence.value?.status !== "awaiting_review") {
    incomplete(`awaiting Phase successor receipt or evidence hash mismatch: ${successorRef}`);
  }
  const scanValue = scan.value;
  const allowedFiles = phaseResult.declared_allowed_files;
  const guardedC2Paths = phaseResult.declared_guarded_c2_paths ?? [];
  if (!scanValue || scanValue.phase_id !== successor.phase_id
    || scanValue.snapshot_tree !== successor.current_snapshot_tree
    || scanValue.safe !== true
    || (scanValue.violations ?? []).length !== 0
    || (scanValue.allowlist_violations ?? []).length !== 0
    || !sameOrderedArray(scanValue.allowed_files, allowedFiles)
    || !sameOrderedArray(scanValue.guarded_c2_paths ?? [], guardedC2Paths)
    || scanValue.changed_files.some((path) => !allowedFiles.includes(path))) {
    incomplete(`awaiting Phase successor allowlist or diff binding is invalid: ${successorRef}`);
  }
  const snapshotTree = successor.current_snapshot_tree;
  const implementationValue = implementation.value;
  const greenValue = green.value;
  if (implementationValue?.task_id !== task.identity.taskId
    || greenValue?.task_id !== task.identity.taskId
    || implementationValue.snapshot_tree !== snapshotTree
    || greenValue.snapshot_tree !== snapshotTree
    || !OID.test(implementationValue.snapshot_commit ?? "")
    || !OID.test(greenValue.snapshot_commit ?? "")
    || gitTree(sourceRoot, implementationValue.snapshot_commit) !== snapshotTree
    || gitTree(sourceRoot, scanValue.implementation_commit) !== snapshotTree) {
    incomplete(`awaiting Phase successor receipts do not bind current snapshot tree: ${successorRef}`);
  }
  const predecessorCommit = successor.previous_implementation_commit;
  const currentCommit = implementationValue.snapshot_commit;
  let ancestor = gitAncestor(sourceRoot, predecessorCommit, currentCommit);
  if (!ancestor && successor.baseline_continuity === "legacy-commit-current-head-continuity") {
    ancestor = gitAncestor(sourceRoot, git(sourceRoot, ["rev-parse", "HEAD"], "current Git head"), currentCommit);
  }
  if (!ancestor && PHASE_SUCCESSOR_REF.test(successor.predecessor_phase_trace_ref ?? "")) {
    // The predecessor successor has already been recursively authenticated
    // above. Its historical synthetic snapshot commit may not be an ancestor
    // of the fresh current snapshot, so require continuity from this run's
    // HEAD rather than rejecting the active successor chain.
    ancestor = gitAncestor(sourceRoot, git(sourceRoot, ["rev-parse", "HEAD"], "current Git head"), currentCommit);
  }
  if (!ancestor) incomplete(`awaiting Phase successor Git ancestry is invalid: ${successorRef}`);
  return Object.freeze({
    traceRef: successorRef,
    traceSha256: successorRecord.sha256,
    pendingSuccessor: Object.freeze({ ref: successorRef, sha256: successorRecord.sha256 }),
    trace: Object.freeze({
      schema_version: "phase-map-trace.pending.v1",
      phase_id: successor.phase_id,
      baseline_commit: scanValue.baseline_commit,
      implementation_commit: scanValue.implementation_commit,
      base_tree: scanValue.base_tree,
      snapshot_tree: snapshotTree,
      allowed_files: [...allowedFiles],
      guarded_c2_paths: [...guardedC2Paths],
      changed_files: [...scanValue.changed_files],
      canonical_phase_evidence: { ref: canonicalEvidenceRef, sha256: canonicalEvidence.sha256 },
      diff_scan: { ref: scanRef, sha256: scan.sha256 },
      implementation_receipt: { ref: implementationRef, sha256: implementation.sha256 },
      green_test_receipt: { ref: greenRef, sha256: green.sha256 },
      red_test_receipt: null,
      review_status: "awaiting_review",
      review_result: null,
      review_attempt: null,
      material_id: successor.material_revision_hash,
      review_scope: "phase",
      verdict: null,
      risk_acceptances: [],
    }),
    phaseEvidence: { value: canonicalEvidence.value },
    scan,
    implementation,
    green,
    red: null,
    review: null,
    attempt: null,
    acceptanceTrace: null,
    predecessorTrace: predecessor.traceRef,
  });
}

/** Validate a pending successor when it is itself used as the immutable
 * predecessor of another successor. This carries forward the old unavailable
 * review fact instead of manufacturing a review result. */
function validatePendingSuccessorPredecessor({ task, sourceRoot, predecessorRef, predecessorHash, successor, skipHistoricalAncestry = false }) {
  if (!PHASE_SUCCESSOR_REF.test(predecessorRef ?? "") || !HASH.test(predecessorHash ?? "")) {
    incomplete(`pending Phase successor predecessor binding is invalid: ${predecessorRef}`);
  }
  const record = readJson(task, predecessorRef, "pending Phase successor predecessor");
  const value = record.value;
  if (record.sha256 !== predecessorHash
      || value?.schema_version !== "workflowhub-build-code-phase-successor.v2"
      || value.task_id !== task.identity.taskId
      || value.stage !== "build-code"
      || value.phase_id !== successor.phase_id
      || value.current_snapshot_tree !== successor.previous_snapshot_tree
      || !OID.test(value.current_snapshot_commit ?? "")
      || !HASH.test(value.material_revision_hash ?? "")
      || JSON.stringify(value.allowed_files ?? []) !== JSON.stringify(successor.allowed_files ?? [])
      || JSON.stringify(value.guarded_c2_paths ?? []) !== JSON.stringify(successor.guarded_c2_paths ?? [])) {
    incomplete(`pending Phase successor predecessor does not bind the next successor: ${predecessorRef}`);
  }
  const material = readJson(task, "materials/current.json", "current material revision").value;
  if (material?.task_id !== task.identity.taskId || material.revision_hash !== value.material_revision_hash
      || material.revision_hash !== successor.material_revision_hash) {
    incomplete(`pending Phase successor predecessor material is stale: ${predecessorRef}`);
  }
  for (const [label, ref, hash] of [
    ["implementation", value.implementation_receipt_ref, value.implementation_receipt_hash],
    ["GREEN", value.green_test_receipt_ref, value.green_test_receipt_hash],
  ]) {
    if (typeof ref !== "string" || !HASH.test(hash ?? "")) incomplete(`pending Phase successor ${label} binding is invalid: ${predecessorRef}`);
    const receipt = readJson(task, ref, `pending Phase successor ${label}`);
    if (receipt.sha256 !== hash || receipt.value?.task_id !== task.identity.taskId
        || receipt.value?.snapshot_tree !== value.current_snapshot_tree
        || git(sourceRoot, ["rev-parse", `${receipt.value.snapshot_commit}^{tree}`], `pending Phase successor ${label}`) !== value.current_snapshot_tree) {
      incomplete(`pending Phase successor ${label} does not bind its snapshot tree: ${predecessorRef}`);
    }
  }
  const oldTraceRef = value.predecessor_phase_trace_ref;
  const oldTraceHash = value.predecessor_phase_trace_hash;
  if ((!/^evidence\/phases\/[A-Za-z0-9._-]+\/[a-f0-9]{40,64}\/phase-map-trace-[a-f0-9]{64}\.json$/.test(oldTraceRef ?? "")
        && !PHASE_SUCCESSOR_REF.test(oldTraceRef ?? ""))
      || !HASH.test(oldTraceHash ?? "")) incomplete(`pending Phase successor old predecessor trace is invalid: ${predecessorRef}`);
  const predecessorIdentity = PHASE_SUCCESSOR_REF.test(oldTraceRef)
    ? validatePendingSuccessorPredecessor({
      task, sourceRoot, predecessorRef: oldTraceRef, predecessorHash: oldTraceHash,
      successor: value, skipHistoricalAncestry: true,
    })
    : phaseTrace(task, sourceRoot, oldTraceRef);
  const oldTrace = predecessorIdentity.oldTrace ?? predecessorIdentity;
  const predecessorHashActual = predecessorIdentity.traceSha256 ?? predecessorIdentity.sha256;
  if (predecessorHashActual !== oldTraceHash
      || oldTrace.trace.phase_id !== value.phase_id
      || oldTrace.trace.review_status !== "unavailable"
      || value.previous_phase_review_ref !== oldTrace.attempt?.ref
      || value.previous_phase_review_hash !== oldTrace.attempt?.sha256) {
    incomplete(`pending Phase successor old review is not unavailable and bound: ${predecessorRef}`);
  }
  if (git(sourceRoot, ["rev-parse", `${value.current_snapshot_commit}^{tree}`], "pending Phase successor") !== value.current_snapshot_tree) {
    incomplete(`pending Phase successor snapshot tree is invalid: ${predecessorRef}`);
  }
  // A successor that is itself superseded remains immutable audit history. Its
  // old Git ancestry may point at an ephemeral runner tree; the active child
  // has already authenticated the successor's identity, receipts, and old
  // trace above. Do not let that stale ancestry block the active chain.
  if (skipHistoricalAncestry) return Object.freeze({ ref: predecessorRef, sha256: predecessorHash, value, oldTrace });
  let ancestor = false;
  try {
    git(sourceRoot, ["merge-base", "--is-ancestor", value.previous_implementation_commit, value.current_snapshot_commit], "pending Phase successor Git ancestry");
    ancestor = true;
  } catch {
    if (value.baseline_continuity === "legacy-commit-current-head-continuity") {
      const head = git(sourceRoot, ["rev-parse", "HEAD"], "pending Phase successor Git head");
      try { git(sourceRoot, ["merge-base", "--is-ancestor", head, value.current_snapshot_commit], "pending Phase successor legacy continuity"); ancestor = true; }
      catch { /* handled below */ }
    }
  }
  if (!ancestor) incomplete(`pending Phase successor Git ancestry is invalid: ${predecessorRef}`);
  return Object.freeze({ ref: predecessorRef, sha256: predecessorHash, value, oldTrace });
}

/** Select canonical traces; only an exact prevalidated legacy binding may skip an invalid historical trace. */
export function selectCanonicalPhaseTraces({
  task, sourceRoot, corrections, readTrace = phaseTrace,
} = {}) {
  if (!task || typeof task !== "object") throw new TypeError("task is required");
  if (typeof sourceRoot !== "string" || sourceRoot.length === 0) throw new TypeError("sourceRoot is required");
  if (!(corrections instanceof Map)) throw new TypeError("prevalidated corrections are required");
  // A legacy refresh/progress note can share the Phase evidence directory
  // without being a canonical trace.  Ignore only such historical namespace
  // debris here; actual phase-map traces still go through readTrace and fail
  // closed on identity, material, snapshot, receipt, or review mismatches.
  const traces = task.listCanonicalPhaseMapTraceRefs({ tolerateHistoricalInvalidRecords: true }).flatMap((ref) => {
    try { return [readTrace(task, sourceRoot, ref)]; }
    catch (error) {
      let trace;
      try { trace = JSON.parse(task.readRecord(ref)); } catch { throw error; }
      const correction = corrections.get(trace?.review_result?.ref);
      if (correction?.sha256 === trace?.review_result?.sha256) return [];
      throw error;
    }
  });
  // A same-phase replacement is not a new chain edge.  It is a bounded
  // supersession of one immutable trace after a successor refresh.  Keep the
  // old trace for audit, but only expose the replacement to path construction
  // when the successor record binds both sides exactly.  An unbound duplicate
  // remains visible and therefore makes integration fail closed as ambiguous.
  const byPhase = new Map();
  for (const trace of traces) {
    const list = byPhase.get(trace.trace.phase_id) ?? [];
    list.push(trace);
    byPhase.set(trace.trace.phase_id, list);
  }
  const superseded = new Set();
  for (const trace of traces) {
    const phaseEvidence = trace.phaseEvidence?.value;
    const successorRef = phaseEvidence?.phase_successor_ref;
    const successorHash = phaseEvidence?.phase_successor_hash;
    if (typeof successorRef !== "string" || !HASH.test(successorHash ?? "")) continue;
    let successor;
    try {
      const record = readJson(task, successorRef, "Phase successor");
      if (record.sha256 !== successorHash
          || record.value?.schema_version !== "workflowhub-build-code-phase-successor.v2"
          || record.value?.task_id !== task.identity.taskId
          || record.value?.stage !== "build-code"
          || record.value?.phase_id !== trace.trace.phase_id
          || record.value?.current_snapshot_tree !== trace.trace.snapshot_tree
          || record.value?.previous_canonical_phase_evidence_ref === undefined
          || !HASH.test(record.value?.previous_canonical_phase_evidence_hash ?? "")
          || record.value?.previous_snapshot_tree === undefined) continue;
      successor = record.value;
    } catch {
      continue;
    }
    const predecessor = (byPhase.get(trace.trace.phase_id) ?? []).find((candidate) =>
      candidate !== trace
      && candidate.trace.canonical_phase_evidence.ref === successor.previous_canonical_phase_evidence_ref
      && candidate.trace.canonical_phase_evidence.sha256 === successor.previous_canonical_phase_evidence_hash
      && candidate.trace.snapshot_tree === successor.previous_snapshot_tree);
    if (predecessor === undefined) continue;
    superseded.add(predecessor);
  }
  // Explicit historical predecessors are recorded on the immutable successor
  // itself.  This path intentionally does not consult phase-result.json: the
  // live pointer may have moved since the predecessor was accepted.
  const successorRefs = typeof task.listCanonicalPhaseSuccessorRefs === "function"
    ? task.listCanonicalPhaseSuccessorRefs()
    : [];
  const supersedingSuccessorRefs = new Set();
  for (const ref of successorRefs) {
    const value = readJson(task, ref, "Phase successor").value;
    if (PHASE_SUCCESSOR_REF.test(value?.predecessor_phase_trace_ref ?? "")) {
      supersedingSuccessorRefs.add(value.predecessor_phase_trace_ref);
    }
  }
  const markSuccessorHistory = (successorRef, visited = new Set()) => {
    if (visited.has(successorRef)) return;
    visited.add(successorRef);
    let value;
    try { value = readJson(task, successorRef, "historical Phase successor").value; }
    catch { return; }
    for (const trace of traces) {
      if (trace.trace.phase_id === value?.phase_id && trace.trace.snapshot_tree === value?.current_snapshot_tree) {
        superseded.add(trace);
      }
    }
    const predecessorRef = value?.predecessor_phase_trace_ref;
    if (PHASE_SUCCESSOR_REF.test(predecessorRef ?? "")) {
      markSuccessorHistory(predecessorRef, visited);
    } else if (typeof predecessorRef === "string") {
      const predecessor = traces.find((trace) => trace.traceRef === predecessorRef);
      if (predecessor !== undefined) superseded.add(predecessor);
    }
  };
  for (const ref of supersedingSuccessorRefs) markSuccessorHistory(ref);
  const awaitingSuccessors = [];
  for (const successorRef of successorRefs) {
    const successorRecord = readJson(task, successorRef, "Phase successor");
    const successor = successorRecord.value;
    const explicitRef = successor?.predecessor_phase_trace_ref;
    const explicitHash = successor?.predecessor_phase_trace_hash;
    if (explicitRef === undefined && explicitHash === undefined) continue;
    const explicitTraceRef = typeof explicitRef === "string" && /^evidence\/phases\/[A-Za-z0-9._-]+\/[a-f0-9]{40,64}\/phase-map-trace-[a-f0-9]{64}\.json$/.test(explicitRef);
    const explicitSuccessorRef = typeof explicitRef === "string" && PHASE_SUCCESSOR_REF.test(explicitRef);
    if (typeof explicitRef !== "string" || (!explicitTraceRef && !explicitSuccessorRef)
        || !HASH.test(explicitHash ?? "")
        || successorRecord.value?.schema_version !== "workflowhub-build-code-phase-successor.v2"
        || successor.task_id !== task.identity.taskId
        || successor.stage !== "build-code"
        || !PHASE.test(successor.phase_id ?? "")
        || !OID.test(successor.previous_snapshot_tree ?? "")
        || !OID.test(successor.current_snapshot_tree ?? "")) {
      incomplete(`explicit Phase successor binding is invalid: ${successorRef}`);
    }
    const isSupersededSuccessor = supersedingSuccessorRefs.has(successorRef);
    if (isSupersededSuccessor) {
      // This record is retained for audit only. The child successor has
      // already authenticated its direct binding; do not re-enter this
      // historical node as an active path candidate.
      continue;
    }
    if (explicitSuccessorRef) {
      validatePendingSuccessorPredecessor({
        task, sourceRoot, predecessorRef: explicitRef, predecessorHash: explicitHash, successor,
        skipHistoricalAncestry: supersedingSuccessorRefs.has(explicitRef),
      });
    }
    let predecessorTrace;
    if (explicitTraceRef) {
      try {
        predecessorTrace = readTrace(task, sourceRoot, explicitRef);
      } catch (error) {
        incomplete(`explicit Phase successor predecessor trace is invalid: ${explicitRef}: ${error.message}`);
      }
    }
    if (explicitTraceRef && (predecessorTrace.traceSha256 !== explicitHash
        || predecessorTrace.trace.phase_id !== successor.phase_id
        || predecessorTrace.trace.snapshot_tree !== successor.previous_snapshot_tree
        || predecessorTrace.trace.baseline_commit !== successor.previous_baseline_commit
        || predecessorTrace.trace.implementation_commit !== successor.previous_implementation_commit
        || !sameBinding(predecessorTrace.trace.diff_scan, { ref: successor.previous_diff_scan_ref, sha256: successor.previous_diff_scan_hash })
        || !sameBinding(predecessorTrace.trace.canonical_phase_evidence, {
          ref: successor.previous_canonical_phase_evidence_ref,
          sha256: successor.previous_canonical_phase_evidence_hash,
        }))) {
      incomplete(`explicit Phase successor predecessor does not bind its canonical trace: ${successorRef}`);
    }
    const predecessor = explicitTraceRef
      ? traces.find((candidate) => candidate.traceRef === explicitRef && candidate.traceSha256 === explicitHash)
      : undefined;
    if (explicitTraceRef && predecessor === undefined) {
      incomplete(`explicit Phase successor predecessor trace is not canonical in the selected evidence set: ${explicitRef}`);
    }
    if (explicitTraceRef && supersedingSuccessorRefs.has(successorRef)) {
      // This immutable successor is itself superseded by a newer successor.
      // Do not try to expose its old awaiting pointer as current.
      superseded.add(predecessor);
      continue;
    }
    const replacement = traces.find((candidate) => candidate.trace.phase_id === successor.phase_id
      && candidate.trace.snapshot_tree === successor.current_snapshot_tree);
    if (replacement === undefined) {
      // A successor may be published before its own Phase review.  Keep the
      // historical predecessor out of the candidate path, but expose a
      // fully-bound pending node so callers can report the real awaiting state
      // instead of treating the old snapshot as current.
      awaitingSuccessors.push(awaitingSuccessorCandidate({
        task, sourceRoot, successorRef, successor,
        predecessor: predecessor ?? { traceRef: explicitRef }, successorRecord,
      }));
      if (predecessor !== undefined) superseded.add(predecessor);
    } else if (replacement === predecessor) {
      incomplete(`explicit Phase successor replacement snapshot is not canonical: ${successorRef}`);
    } else {
      superseded.add(predecessor);
    }
  }
  return [...traces.filter((trace) => !superseded.has(trace)), ...awaitingSuccessors];
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

function isTasksCompletionSeam({
  task,
  sourceRoot,
  taskId,
  previousTrace,
  previousCommit,
  previousTree,
  baselineCommit,
  baselineTree,
}) {
  try {
    if (!previousTrace) return false;
    const parentLine = execFileSync("git", ["rev-list", "--parents", "-n", "1", baselineCommit], {
      cwd: sourceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim().split(/\s+/);
    if (parentLine.length !== 2 || parentLine[1] !== previousCommit) return false;
    const actualPreviousTree = execFileSync("git", ["rev-parse", `${previousCommit}^{tree}`], {
      cwd: sourceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    const actualBaselineTree = execFileSync("git", ["rev-parse", `${baselineCommit}^{tree}`], {
      cwd: sourceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    if (actualPreviousTree !== previousTree || actualBaselineTree !== baselineTree) return false;
    const tasksPath = `specs/${taskId}/tasks.md`;
    const changed = execFileSync("git", ["diff", "--name-only", previousCommit, baselineCommit, "--"], {
      cwd: sourceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim().split("\n").filter(Boolean);
    if (changed.length !== 1 || changed[0] !== tasksPath) return false;
    const before = execFileSync("git", ["show", `${previousCommit}:${tasksPath}`], {
      cwd: sourceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    const after = execFileSync("git", ["show", `${baselineCommit}:${tasksPath}`], {
      cwd: sourceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    const plan = execFileSync("git", ["show", `${baselineCommit}:specs/${taskId}/plan.md`], {
      cwd: sourceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    const phaseTasks = resolvePhaseTaskIds({ plan, tasks: after, phaseId: previousTrace.trace.phase_id });
    const reviewAction = previousTrace.review ?? previousTrace.attempt;
    const requiredBindings = [
      { ref: previousTrace.implementation.ref, sha256: previousTrace.implementation.sha256 },
      { ref: previousTrace.green.ref, sha256: previousTrace.green.sha256 },
      { ref: reviewAction.ref, sha256: reviewAction.sha256 },
    ];
    return validateTasksOnlyCompletionSeam({
      before,
      after,
      allowedTaskIds: phaseTasks.task_ids,
      requiredBindings,
      expectedReviewRef: reviewAction.ref,
      completionEvidence: ({ ref }) => {
        try { return task.readRecord(ref); }
        catch (error) {
          if (error?.code === "ENOENT") return undefined;
          throw error;
        }
      },
    }).ok;
  } catch {
    return false;
  }
}

/**
 * The first Phase has no predecessor trace.  Its only admissible bridge is
 * the accepted build-plan checkpoint followed by a direct, material-only
 * commit for this exact task.  This is intentionally stricter than the
 * normal tasks-completion seam: no code, tests, or unrelated task may enter
 * the chain before Phase 0 starts.
 */
export function isInitialTasksCompletionSeam({ task, sourceRoot, acceptedCommit, acceptedTree, candidateTrace } = {}) {
  try {
    if (!task || typeof sourceRoot !== "string" || sourceRoot.length === 0
      || !candidateTrace?.trace || typeof acceptedCommit !== "string" || typeof acceptedTree !== "string") return false;
    const candidate = candidateTrace.trace;
    if (typeof candidate.baseline_commit !== "string" || typeof candidate.base_tree !== "string"
      || candidate.baseline_commit === acceptedCommit) return false;
    const parentLine = execFileSync("git", ["rev-list", "--parents", "-n", "1", candidate.baseline_commit], {
      cwd: sourceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim().split(/\s+/);
    if (parentLine.length !== 2 || parentLine[1] !== acceptedCommit) return false;
    if (gitTree(sourceRoot, acceptedCommit) !== acceptedTree
      || gitTree(sourceRoot, candidate.baseline_commit) !== candidate.base_tree) return false;
    const taskRoot = `specs/${task.identity.taskId}`;
    const materialPaths = new Set(["decision-log.md", "spec.md", "plan.md", "tasks.md"]
      .map((name) => `${taskRoot}/${name}`));
    const changed = execFileSync("git", ["diff", "--name-only", acceptedCommit, candidate.baseline_commit, "--"], {
      cwd: sourceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim().split("\n").filter(Boolean);
    return changed.length > 0 && changed.includes(`${taskRoot}/tasks.md`)
      && changed.every((path) => materialPaths.has(path));
  } catch {
    return false;
  }
}

function isFinalTasksCompletionSeam({ task, sourceRoot, previousTrace, previousTree, finalTree }) {
  try {
    const taskId = task.identity.taskId;
    const tasksPath = `specs/${taskId}/tasks.md`;
    const changed = execFileSync("git", ["diff", "--name-only", previousTree, finalTree, "--"], {
      cwd: sourceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim().split("\n").filter(Boolean);
    if (changed.length !== 1 || changed[0] !== tasksPath) return false;
    const before = execFileSync("git", ["show", `${previousTree}:${tasksPath}`], {
      cwd: sourceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    const after = execFileSync("git", ["show", `${finalTree}:${tasksPath}`], {
      cwd: sourceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    const plan = execFileSync("git", ["show", `${finalTree}:specs/${taskId}/plan.md`], {
      cwd: sourceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    const phaseTasks = resolvePhaseTaskIds({ plan, tasks: after, phaseId: previousTrace.trace.phase_id });
    const reviewAction = previousTrace.review ?? previousTrace.attempt;
    const requiredBindings = [
      { ref: previousTrace.implementation.ref, sha256: previousTrace.implementation.sha256 },
      { ref: previousTrace.green.ref, sha256: previousTrace.green.sha256 },
      { ref: reviewAction.ref, sha256: reviewAction.sha256 },
    ];
    return validateTasksOnlyCompletionSeam({
      before,
      after,
      allowedTaskIds: phaseTasks.task_ids,
      requiredBindings,
      expectedReviewRef: reviewAction.ref,
      completionEvidence: ({ ref }) => {
        try { return task.readRecord(ref); }
        catch (error) {
          if (error?.code === "ENOENT") return undefined;
          throw error;
        }
      },
    }).ok;
  } catch {
    return false;
  }
}

function gitAncestor(root, ancestor, descendant) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: root, stdio: ["ignore", "ignore", "ignore"],
    });
    return true;
  } catch (error) {
    if (error?.status === 1) return false;
    throw error;
  }
}

function gitTree(root, commit) {
  return execFileSync("git", ["rev-parse", `${commit}^{tree}`], {
    cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function safeRepositoryPath(path) {
  return typeof path === "string" && path.length > 0 && !path.startsWith("/") && !path.includes("\\")
    && !path.split("/").some((part) => part === "" || part === "." || part === "..");
}

/**
 * An unavailable Phase review is still a real, authenticated quality fact.
 * It may be carried through an existing integration chain, but only when the
 * canonical Phase trace and the formal wh-review attempt agree completely.
 * A null/missing attempt is not an unavailable review; it is incomplete
 * material and must not become a continuation seam.
 */
function isBoundUnavailablePhaseReview({ task, traceRecord, trace } = {}) {
  const status = trace?.review_status ?? (trace?.review_result === null ? "unavailable" : "semantic");
  if (status !== "unavailable") return false;
  const reviewAttempt = traceRecord?.attempt;
  const attemptBinding = trace?.review_attempt;
  const attempt = reviewAttempt?.value;
  if (trace?.verdict !== null || trace?.review_result !== null || traceRecord?.review !== null
    || !attemptBinding || !PHASE_REVIEW_ATTEMPT_REF.test(attemptBinding.ref ?? "")
    || !HASH.test(attemptBinding.sha256 ?? "")
    || !reviewAttempt || reviewAttempt.ref !== attemptBinding.ref
    || (reviewAttempt.sha256 ?? reviewAttempt.hash) !== attemptBinding.sha256
    || !attempt || typeof attempt !== "object" || Array.isArray(attempt)) return false;
  const expected = {
    task_id: task?.identity?.taskId,
    stage: "build-code",
    subject_kind: "phase",
    phase_id: trace.phase_id,
    review_scope: "phase",
    base_tree: trace.base_tree,
    candidate_tree: trace.snapshot_tree,
    snapshot_tree: trace.snapshot_tree,
    material_id: trace.material_id,
  };
  if (Object.entries(expected).some(([key, value]) => attempt[key] !== value)
    || attempt.version !== "wh-review-attempt.v1"
    || attempt.terminal_status !== "unavailable"
    || !Array.isArray(attempt.provider_attempts) || attempt.provider_attempts.length === 0
    || !attempt.error || typeof attempt.error !== "object" || Array.isArray(attempt.error)
    || typeof attempt.error.code !== "string" || attempt.error.code.trim() === ""
    || typeof attempt.error.message !== "string" || attempt.error.message.trim() === "") return false;
  return true;
}

/**
 * Accept a successor whose baseline is a real, material-only descendant of
 * the previous Phase implementation.  This is deliberately narrower than a
 * generic Git ancestry check: every commit on the ancestry path may touch
 * only this task's four canonical materials, and all receipts remain bound
 * to the successor tree.  The caller never supplies a baseline or path.
 */
export function isVerifiedDescendantContinuation({ task, sourceRoot, previousTrace, candidateTrace } = {}) {
  try {
    if (!task || typeof task !== "object" || typeof sourceRoot !== "string" || sourceRoot.length === 0
      || !previousTrace?.trace || !candidateTrace?.trace) return false;
    const previous = previousTrace.trace;
    const candidate = candidateTrace.trace;
    if (previous.phase_id === candidate.phase_id
      || typeof previous.implementation_commit !== "string"
      || typeof previous.snapshot_tree !== "string"
      || typeof candidate.baseline_commit !== "string"
      || typeof candidate.base_tree !== "string") return false;
    const previousReviewStatus = previous.review_status ?? (previous.review_result === null ? "unavailable" : "semantic");
    const candidateReviewStatus = candidate.review_status ?? (candidate.review_result === null ? "unavailable" : "semantic");
    if (previousReviewStatus === "unavailable" && !isBoundUnavailablePhaseReview({ task, traceRecord: previousTrace, trace: previous })) return false;
    if (candidateReviewStatus === "unavailable") {
      if (!isBoundUnavailablePhaseReview({ task, traceRecord: candidateTrace, trace: candidate })) return false;
    } else if (candidateReviewStatus !== "semantic"
      || candidateTrace.review === null
      || !["pass", "revise_required"].includes(candidate.verdict)
      || candidateTrace.review?.value?.verdict !== candidate.verdict) return false;

    const previousTree = gitTree(sourceRoot, previous.implementation_commit);
    const baselineTree = gitTree(sourceRoot, candidate.baseline_commit);
    if (previousTree !== previous.snapshot_tree || baselineTree !== candidate.base_tree
      || previous.implementation_commit === candidate.baseline_commit
      || !gitAncestor(sourceRoot, previous.implementation_commit, candidate.baseline_commit)
      || !gitAncestor(sourceRoot, candidate.baseline_commit, candidate.implementation_commit)) return false;

    // A material successor cannot hide a transient code change in a commit
    // that was later reverted.  Inspect every commit on the ancestry path,
    // not only the net diff between the two endpoints.
    const taskRoot = `specs/${task.identity.taskId}`;
    const materialPaths = new Set(["decision-log.md", "spec.md", "plan.md", "tasks.md"]
      .map((name) => `${taskRoot}/${name}`));
    const commits = execFileSync("git", ["rev-list", "--parents", "--ancestry-path", `${previous.implementation_commit}..${candidate.baseline_commit}`], {
      cwd: sourceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim().split("\n").filter(Boolean);
    if (commits.length === 0) return false;
    for (const line of commits) {
      const [commit, ...parents] = line.split(/\s+/);
      if (parents.length !== 1) return false;
      const changed = execFileSync("git", ["diff-tree", "--root", "--no-commit-id", "--name-only", "-r", commit], {
        cwd: sourceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      }).trim().split("\n").filter(Boolean);
      if (changed.some((path) => !materialPaths.has(path))) return false;
    }

    const implementation = candidateTrace.implementation?.value;
    const green = candidateTrace.green?.value;
    const scan = candidateTrace.scan?.value;
    const traceImplementation = candidate.implementation_receipt;
    const traceGreen = candidate.green_test_receipt;
    const implementationHash = candidateTrace.implementation?.sha256 ?? candidateTrace.implementation?.hash;
    const greenHash = candidateTrace.green?.sha256 ?? candidateTrace.green?.hash;
    if (!implementation || !green || !scan
      || !sameBinding(traceImplementation, { ref: candidateTrace.implementation.ref, sha256: implementationHash })
      || !sameBinding(traceGreen, { ref: candidateTrace.green.ref, sha256: greenHash })
      || implementation.task_id !== task.identity.taskId || green.task_id !== task.identity.taskId
      || implementation.snapshot_tree !== candidate.snapshot_tree || green.snapshot_tree !== candidate.snapshot_tree
      || !OID.test(implementation.snapshot_commit ?? "") || !OID.test(green.snapshot_commit ?? "")
      || gitTree(sourceRoot, implementation.snapshot_commit) !== candidate.snapshot_tree
      || gitTree(sourceRoot, green.snapshot_commit) !== candidate.snapshot_tree
      || scan.baseline_commit !== candidate.baseline_commit
      || scan.implementation_commit !== candidate.implementation_commit
      || scan.snapshot_tree !== candidate.snapshot_tree
      || scan.safe !== true || (scan.violations ?? []).length !== 0
      || (scan.allowlist_violations ?? []).length !== 0
      || !sameOrderedArray(scan.allowed_files, candidate.allowed_files)
      || !sameOrderedArray(scan.changed_files, candidate.changed_files)
      || !Array.isArray(implementation.changed)
      || !sameOrderedArray(implementation.changed, candidate.allowed_files)
      || candidate.allowed_files.some((path) => !safeRepositoryPath(path))
      || candidate.changed_files.some((path) => !safeRepositoryPath(path))) return false;
    const allowed = new Set(candidate.allowed_files);
    if (candidate.changed_files.some((path) => !allowed.has(path))) return false;
    return true;
  } catch {
    return false;
  }
}

function possiblePaths(traces, commit, tree, finalTree, sourceRoot, task, acceptedCommit, acceptedTree, previousTrace = null, seen = new Set()) {
  const key = `${commit}:${tree}`;
  if (seen.has(key)) return [];
  const nextSeen = new Set(seen); nextSeen.add(key);
  const paths = [];
  for (const trace of traces) {
    const direct = trace.trace.baseline_commit === commit && trace.trace.base_tree === tree;
    const tasksSeam = !direct && (previousTrace
      ? isTasksCompletionSeam({
        task,
        sourceRoot,
        taskId: task.identity.taskId,
        previousTrace,
        previousCommit: commit,
        previousTree: tree,
        baselineCommit: trace.trace.baseline_commit,
        baselineTree: trace.trace.base_tree,
      })
      : commit === acceptedCommit && tree === acceptedTree
        && isInitialTasksCompletionSeam({ task, sourceRoot, acceptedCommit, acceptedTree, candidateTrace: trace }));
    const descendant = !direct && !tasksSeam && isVerifiedDescendantContinuation({
      task,
      sourceRoot,
      previousTrace,
      candidateTrace: trace,
    });
    if (!direct && !tasksSeam && !descendant) continue;
    const coverage = traceCoverage(trace);
    if (coverage.snapshot_tree === finalTree) {
      paths.push([coverage]);
      continue;
    }
    if (isFinalTasksCompletionSeam({
      task,
      sourceRoot,
      previousTrace: trace,
      previousTree: coverage.snapshot_tree,
      finalTree,
    })) {
      paths.push([Object.freeze({ ...coverage, completion_tree: finalTree })]);
      continue;
    }
    for (const suffix of possiblePaths(
      traces,
      coverage.implementation_commit,
      coverage.snapshot_tree,
      finalTree,
      sourceRoot,
      task,
      acceptedCommit,
      acceptedTree,
      trace,
      nextSeen,
    )) {
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
  const paths = possiblePaths(
    traces, accepted.commit, accepted.tree, finalTree, sourceRoot, safeTask,
    accepted.commit, accepted.tree,
  );
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
    formal_record_status: Object.freeze({
      status: "available",
      reason: "canonical Phase history was available for optional audit enrichment",
    }),
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

/**
 * Best-effort audit view. Canonical Phase history enriches an integration
 * review when present, but its absence never controls build-code completion.
 */
export function inspectIntegrationReviewSubject(options = {}) {
  try {
    return buildIntegrationReviewSubject(options);
  } catch (error) {
    if (error?.code !== "MATERIAL_INCOMPLETE") throw error;
    return Object.freeze({
      schema_version: "integration-review-subject.v1",
      subject_kind: "worktree",
      review_scope: "integration",
      snapshot_tree: options.finalTree,
      formal_record_status: Object.freeze({
        status: "unavailable",
        reason: String(error.message).replace(/^MATERIAL_INCOMPLETE:\s*/, ""),
      }),
    });
  }
}
