import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { assertTaskHandle } from "../../core/task-handle.mjs";
import { deriveSeriousReviewPause, validateRiskAcceptanceSet } from "./stage-review-disposition.mjs";
import { validateSchema } from "./schema-validator.mjs";
import { isRuntimeOnlyPath, normalizeRuntimeOnlyPaths } from "../evidence/canonical-utils.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/;
const TRACE_REF = /^evidence\/phases\/([A-Za-z0-9._-]+)\/([a-f0-9]{40,64})\/phase-map-trace-([a-f0-9]{64})\.json$/;
const PHASE_EVIDENCE_REF = /^evidence\/phases\/([A-Za-z0-9._-]+)\/([a-f0-9]{40,64})\/phase-evidence-([a-f0-9]{64})\.json$/;
const RECORD_REF = /^(?:receipts|reviews|evidence)\/[A-Za-z0-9][A-Za-z0-9._/-]*$/;

function invalid(message) {
  const error = new Error(`PHASE_EVIDENCE_INVALID: ${message}`);
  error.code = "PHASE_EVIDENCE_INVALID";
  throw error;
}

function git(root, args) {
  try { return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim(); }
  catch { invalid(`Git object is unavailable: ${args.at(-1)}`); }
}

function isAncestor(root, baseline, implementation) {
  try { execFileSync("git", ["merge-base", "--is-ancestor", baseline, implementation], { cwd: root }); return true; }
  catch (error) {
    if (error.status === 1) return false;
    invalid("phase commit ancestry is unavailable");
  }
}

function readJson(task, ref, label) {
  let raw;
  try { raw = task.readRecord(ref); }
  catch { invalid(`${label} is missing or invalid: ${ref}`); }
  try { return { raw, value: JSON.parse(raw), sha256: createHash("sha256").update(raw).digest("hex") }; }
  catch { invalid(`${label} is missing or invalid: ${ref}`); }
}

function recordRef(value, label) {
  if (typeof value !== "string" || !RECORD_REF.test(value) || value.includes("..")) invalid(`${label} ref is invalid`);
  return value;
}

function boundRecord(task, binding, label) {
  if (!binding || typeof binding !== "object" || Array.isArray(binding)) invalid(`${label} binding is invalid`);
  const ref = recordRef(binding.ref, label);
  if (!HASH.test(binding.sha256 ?? "")) invalid(`${label} hash is invalid`);
  const record = readJson(task, ref, label);
  if (record.sha256 !== binding.sha256) invalid(`${label} hash does not match canonical bytes`);
  return { ref, ...record };
}

function sameArray(left, right) {
  return Array.isArray(left) && Array.isArray(right)
    && JSON.stringify(normalizeRuntimeOnlyPaths(left)) === JSON.stringify(normalizeRuntimeOnlyPaths(right));
}

/**
 * Keep the published Phase trace's diff-scan bindings tied to the canonical
 * scan.  The guarded C2 fields are part of the official phase-evidence
 * schema, not reviewer metadata, so a trace must preserve them exactly.
 */
export function phaseTraceMatchesCanonicalScan(trace, scan) {
  return sameArray(trace?.allowed_files, scan?.allowed_files)
    && sameArray(trace?.changed_files, scan?.changed_files)
    && sameArray(trace?.guarded_c2_paths ?? [], scan?.guarded_c2_paths ?? [])
    && JSON.stringify(trace?.guarded_changes ?? []) === JSON.stringify(scan?.guarded_changes ?? []);
}

function expectedPhaseCommitRef(task, trace) {
  return `refs/workflowhub/phases/${task.identity.projectName}/${task.identity.taskId}/build-code/${trace.phase_id}/snapshot-${trace.snapshot_tree}`;
}

function verifyPinnedPhaseCommit({ task, sourceRoot, trace }) {
  const ref = expectedPhaseCommitRef(task, trace);
  if (trace.implementation_commit_ref !== ref) invalid("phase map trace implementation commit ref is invalid");
  if (git(sourceRoot, ["rev-parse", `${ref}^{commit}`]) !== trace.implementation_commit) {
    invalid("phase map trace implementation commit ref does not match");
  }
  if (git(sourceRoot, ["rev-parse", `${ref}^{tree}`]) !== trace.snapshot_tree) {
    invalid("phase map trace implementation commit ref tree does not match");
  }
}

function evidenceHash(task, ref, hash, label) {
  if (typeof ref !== "string" || !/^evidence\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(ref) || ref.includes("..") || !HASH.test(hash ?? "")) {
    invalid(`${label} evidence reference is invalid`);
  }
  let raw;
  try { raw = task.readRecord(ref); }
  catch { invalid(`${label} evidence is missing: ${ref}`); }
  if (createHash("sha256").update(raw).digest("hex") !== hash) invalid(`${label} evidence hash does not match`);
}

function validateImplementationReceipt({ task, receipt, expectedTree }) {
  const value = receipt.value;
  if (value?.schema_version !== "workflowhub-receipt.v1" || value.task_id !== task.identity.taskId || value.stage !== "build-code"
    || value.producer?.stage !== "build-code" || value.producer?.component !== "implementation"
    || !OID.test(value.snapshot_head ?? "") || !OID.test(value.snapshot_commit ?? "") || value.snapshot_tree !== expectedTree) {
    invalid("implementation receipt provenance is invalid");
  }
  evidenceHash(task, value.diff_ref, value.diff_hash, "implementation receipt diff");
}

function validateTestReceipt({ task, receipt, expectedTree, green }) {
  const value = receipt.value;
  if (value?.schema_version !== "workflowhub-receipt.v1" || value.task_id !== task.identity.taskId || value.stage !== "build-code"
    || value.producer?.stage !== "build-code" || value.producer?.component !== "build-code-test-capture"
    || !OID.test(value.snapshot_head ?? "") || !OID.test(value.snapshot_commit ?? "") || value.snapshot_tree !== expectedTree
    || !Number.isInteger(value.exit_code) || (green ? value.exit_code !== 0 : value.exit_code === 0)) {
    invalid(`${green ? "GREEN" : "RED"} test receipt provenance is invalid`);
  }
  evidenceHash(task, value.output_ref, value.output_hash, `${green ? "GREEN" : "RED"} test receipt`);
}

function safeRelative(path) {
  return typeof path === "string" && path !== "" && !path.startsWith("/") && !path.includes("\\")
    && !path.split("/").some((part) => part === "" || part === "." || part === "..");
}

/**
 * Validate the Phase-local portion of an AC trace.  This function only
 * accepts facts already sealed into the Phase review attempt; integration
 * subsequently adds canonical evidence bindings from this trace itself.
 */
export function validatePhaseAcceptanceTrace({ trace, phaseId, baseTree, snapshotTree, changedFiles, greenTestReceipt, required = true } = {}) {
  if (trace === undefined || trace === null) {
    if (!required) return null;
    invalid("Phase acceptance trace is missing");
  }
  if (!trace || typeof trace !== "object" || Array.isArray(trace) ||
      trace.schema_version !== "phase-ac-change-test-trace.v1" || trace.phase_id !== phaseId ||
      trace.base_tree !== baseTree || trace.snapshot_tree !== snapshotTree ||
      !Array.isArray(trace.acceptance_ids) || trace.acceptance_ids.length === 0 ||
      trace.acceptance_ids.some((id) => typeof id !== "string" || id === "") ||
      new Set(trace.acceptance_ids).size !== trace.acceptance_ids.length || !Array.isArray(trace.entries)) {
    invalid("Phase acceptance trace identity is invalid");
  }
  const expectedTestHash = greenTestReceipt?.sha256;
  if (typeof greenTestReceipt?.ref !== "string" || !HASH.test(expectedTestHash ?? "")) {
    invalid("Phase acceptance trace GREEN receipt binding is invalid");
  }
  const knownPaths = new Set(changedFiles);
  const seen = new Set();
  const normalized = [];
  for (const entry of trace.entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) ||
        typeof entry.acceptance_criterion_id !== "string" || !trace.acceptance_ids.includes(entry.acceptance_criterion_id) ||
        seen.has(entry.acceptance_criterion_id) || !Array.isArray(entry.change) || entry.change.length === 0 ||
        !Array.isArray(entry.test) || entry.test.length === 0 || !Array.isArray(entry.anchors) || entry.anchors.length === 0) {
      invalid("Phase acceptance trace entry is incomplete");
    }
    seen.add(entry.acceptance_criterion_id);
    const changeIds = new Set();
    for (const change of entry.change) {
      if (isRuntimeOnlyPath(change?.path)) continue;
      if (!change || typeof change !== "object" || Array.isArray(change) || typeof change.change_id !== "string" || change.change_id === "" ||
          changeIds.has(change.change_id) || !safeRelative(change.path) || !knownPaths.has(change.path)) {
        invalid(`Phase acceptance trace change mapping is invalid for ${entry.acceptance_criterion_id}`);
      }
      changeIds.add(change.change_id);
    }
    const testKeys = new Set();
    for (const test of entry.test) {
      if (!test || typeof test !== "object" || Array.isArray(test) || test.receipt_ref !== greenTestReceipt.ref ||
          test.receipt_hash !== expectedTestHash || testKeys.has(test.receipt_ref)) {
        invalid(`Phase acceptance trace test mapping is not the GREEN receipt for ${entry.acceptance_criterion_id}`);
      }
      testKeys.add(test.receipt_ref);
    }
    const anchorIds = new Set();
    for (const anchor of entry.anchors) {
      if (!anchor || typeof anchor !== "object" || Array.isArray(anchor) || typeof anchor.id !== "string" || anchor.id === "" ||
          anchorIds.has(anchor.id) || !safeRelative(anchor.path) || !Number.isSafeInteger(anchor.start_line) || anchor.start_line < 1 ||
          !Number.isSafeInteger(anchor.end_line) || anchor.end_line < anchor.start_line || typeof anchor.role !== "string" || anchor.role === "" ||
          typeof anchor.reason !== "string" || anchor.reason === "") {
        invalid(`Phase acceptance trace anchors are invalid for ${entry.acceptance_criterion_id}`);
      }
      anchorIds.add(anchor.id);
    }
    const normalizedChanges = entry.change
      .filter(({ path }) => !isRuntimeOnlyPath(path))
      .map(({ change_id, path }) => ({ change_id, path }));
    if (normalizedChanges.length === 0) {
      invalid(`Phase acceptance trace has no deliverable changes for ${entry.acceptance_criterion_id}`);
    }
    normalized.push({
      acceptance_criterion_id: entry.acceptance_criterion_id,
      change: normalizedChanges,
      test: entry.test.map(({ receipt_ref, receipt_hash }) => ({ receipt_ref, receipt_hash })),
      anchors: entry.anchors.map(({ id, path, start_line, end_line, role, reason }) => ({ id, path, start_line, end_line, role, reason })),
    });
  }
  if (seen.size !== trace.acceptance_ids.length) invalid("Phase acceptance trace omits a declared AC");
  return Object.freeze({
    schema_version: "phase-ac-change-test-trace.v1", phase_id: phaseId, base_tree: baseTree, snapshot_tree: snapshotTree,
    acceptance_ids: Object.freeze([...trace.acceptance_ids]), entries: Object.freeze(normalized),
  });
}

export function resolvePhaseReviewSubject({ task, sourceRoot, phaseId } = {}) {
  const safeTask = assertTaskHandle(task);
  if (typeof phaseId !== "string" || !/^[a-zA-Z0-9._-]+$/.test(phaseId)) invalid("phase_id is required");
  const phaseResult = readJson(safeTask, "phase-result.json", "phase result").value;
  if (phaseResult.phase_id !== phaseId) invalid("phase-result.json does not match phase_id");
  const diffRef = phaseResult.evidence?.diff ?? phaseResult.diff_scan?.path;
  if (typeof diffRef !== "string" || diffRef.length === 0) invalid("phase diff evidence ref is missing");
  const scan = readJson(safeTask, diffRef, "phase diff evidence").value;
  const canonicalEvidenceRef = phaseResult.evidence?.canonical_phase_evidence_ref;
  let phaseEvidence;
  if (canonicalEvidenceRef !== undefined) {
    const match = PHASE_EVIDENCE_REF.exec(canonicalEvidenceRef ?? "");
    if (!match || match[1] !== phaseId) invalid("canonical Phase evidence ref is invalid");
    const canonicalEvidence = readJson(safeTask, canonicalEvidenceRef, "canonical Phase evidence");
    if (canonicalEvidence.sha256 !== match[3]) invalid("canonical Phase evidence ref does not match its bytes");
    phaseEvidence = Object.freeze({
      ref: canonicalEvidenceRef,
      sha256: canonicalEvidence.sha256,
    });
  }
  return Object.freeze({
    ...validatePhaseReviewEvidence({ phaseResult, scan, sourceRoot, phaseId }),
    diffEvidenceRef: diffRef,
    ...(phaseEvidence === undefined ? {} : { phaseEvidence }),
  });
}

/**
 * Read a published Phase trace as independently reconstructible evidence.
 * It intentionally has no fallback: historical Phase records without a trace
 * remain incomplete until a later integration subject rejects them explicitly.
 */
export function readPhaseMapTrace({ task, sourceRoot, traceRef } = {}) {
  const safeTask = assertTaskHandle(task);
  const ref = recordRef(traceRef, "phase map trace");
  const refMatch = TRACE_REF.exec(ref);
  if (!refMatch) invalid("phase map trace ref is invalid");
  const traceRecord = readJson(safeTask, ref, "phase map trace");
  const trace = traceRecord.value;
  const reviewStatus = trace?.review_status ?? (trace?.review_result === null ? "unavailable" : "semantic");
  const allowed = new Set([
    "schema_version", "phase_id", "baseline_commit", "implementation_commit", "base_tree", "snapshot_tree",
    "implementation_commit_ref",
    "allowed_files", "changed_files", "guarded_c2_paths", "guarded_changes", "canonical_phase_evidence", "diff_scan", "implementation_receipt",
    "green_test_receipt", "red_test_receipt", "review_status", "review_result", "review_attempt",
    "material_id", "review_scope", "verdict", "risk_acceptances", "acceptance_trace",
  ]);
  const required = [
    "schema_version", "phase_id", "baseline_commit", "implementation_commit", "base_tree", "snapshot_tree",
    "implementation_commit_ref",
    "allowed_files", "changed_files", "canonical_phase_evidence", "diff_scan", "implementation_receipt",
    "green_test_receipt", "red_test_receipt", "review_result", "review_attempt",
    "material_id", "review_scope", "verdict",
  ];
  if (!trace || typeof trace !== "object" || Array.isArray(trace) || required.some((key) => !Object.hasOwn(trace, key)) ||
      Object.keys(trace).some((key) => !allowed.has(key)) ||
      trace.schema_version !== "phase-map-trace.v1" || trace.phase_id !== refMatch[1] || trace.snapshot_tree !== refMatch[2] ||
      !HASH.test(refMatch[3]) || traceRecord.sha256 !== refMatch[3] || trace.review_scope !== "phase" ||
      !["semantic", "unavailable"].includes(reviewStatus) ||
      (reviewStatus === "semantic" ? !["pass", "revise_required"].includes(trace.verdict) : trace.verdict !== null)) {
    invalid("phase map trace identity is invalid");
  }
  const phaseEvidence = boundRecord(safeTask, trace.canonical_phase_evidence, "canonical Phase evidence");
  const scanRecord = boundRecord(safeTask, trace.diff_scan, "Phase diff scan");
  const implementation = boundRecord(safeTask, trace.implementation_receipt, "implementation receipt");
  const green = boundRecord(safeTask, trace.green_test_receipt, "GREEN test receipt");
  const red = trace.red_test_receipt === null ? null : boundRecord(safeTask, trace.red_test_receipt, "RED test receipt");
  const review = trace.review_result === null ? null : boundRecord(safeTask, trace.review_result, "formal Phase review");
  const attempt = boundRecord(safeTask, trace.review_attempt, "formal Phase review attempt");
  if (review !== null) validateSchema("result", review.value);
  validateSchema("attempt", attempt.value);
  const phaseResult = phaseEvidence.value;
  const scan = scanRecord.value;
  const subject = validatePhaseReviewEvidence({ phaseResult, scan, sourceRoot, phaseId: trace.phase_id });
  verifyPinnedPhaseCommit({ task: safeTask, sourceRoot, trace });
  if (trace.base_tree !== subject.baseTree || trace.implementation_commit !== subject.implementationCommit ||
      trace.baseline_commit !== subject.baselineCommit || trace.snapshot_tree !== subject.candidateTree ||
      !phaseTraceMatchesCanonicalScan(trace, scan) ||
      phaseResult.evidence?.diff !== scanRecord.ref || phaseResult.evidence?.implementation_receipt_ref !== implementation.ref ||
      phaseResult.evidence?.green_test_receipt_ref !== green.ref || (phaseResult.evidence?.red_evidence_ref ?? null) !== (red?.ref ?? null)) {
    invalid("phase map trace does not match canonical Phase evidence");
  }
  validateImplementationReceipt({ task: safeTask, receipt: implementation, expectedTree: trace.snapshot_tree });
  validateTestReceipt({ task: safeTask, receipt: green, expectedTree: trace.snapshot_tree, green: true });
  if (red) validateTestReceipt({ task: safeTask, receipt: red, expectedTree: trace.base_tree, green: false });
  const acceptanceTrace = validatePhaseAcceptanceTrace({
    trace: trace.acceptance_trace,
    phaseId: trace.phase_id,
    baseTree: trace.base_tree,
    snapshotTree: trace.snapshot_tree,
    changedFiles: normalizeRuntimeOnlyPaths(trace.changed_files),
    greenTestReceipt: { ref: green.ref, sha256: green.sha256 },
    required: false,
  });
  const expected = {
    task_id: safeTask.identity.taskId, stage: "build-code", subject_kind: "phase", phase_id: trace.phase_id,
    review_scope: "phase", base_tree: subject.baseTree, candidate_tree: subject.candidateTree, snapshot_tree: subject.candidateTree,
    material_id: trace.material_id,
  };
  for (const [key, value] of Object.entries(expected)) {
    if ((review !== null && review.value[key] !== value) || attempt.value[key] !== value) invalid(`phase map trace review ${key} mismatch`);
  }
  const semantic = reviewStatus === "semantic";
  if ((semantic && (review === null || review.value.attempt_ref !== attempt.ref || review.value.verdict !== trace.verdict
      || attempt.value.terminal_status !== "semantic"))
      || (!semantic && (review !== null || attempt.value.terminal_status !== "unavailable" || !attempt.value.error))
      || attempt.value.material_id !== trace.material_id || attempt.value.review_scope !== "phase") {
    invalid("phase map trace review linkage is invalid");
  }
  const riskRecords = (trace.risk_acceptances ?? []).map((binding) => boundRecord(safeTask, binding, "Phase risk acceptance"));
  const preliminary = deriveSeriousReviewPause({
    taskId: safeTask.identity.taskId,
    stage: "build-code",
    reviewRef: semantic ? review.ref : attempt.ref,
    reviewHash: semantic ? review.sha256 : attempt.sha256,
    ...(semantic ? { result: review.value } : { reviewAttempt: attempt.value }),
  });
  if (preliminary.status !== "paused") {
    if (riskRecords.length) invalid("Phase trace has risk acceptances without actionable serious findings");
  } else {
    if (!riskRecords.length) invalid("Phase trace leaves actionable serious findings unresolved");
    const runIds = new Set(riskRecords.map(({ value }) => value?.workflow_run_id));
    const workflowRunId = [...runIds][0];
    if (runIds.size !== 1 || typeof workflowRunId !== "string" || workflowRunId.trim() === "") {
      invalid("Phase trace risk acceptances do not bind one review run");
    }
    const pause = deriveSeriousReviewPause({
      taskId: safeTask.identity.taskId, stage: "build-code",
      reviewRef: review.ref, reviewHash: review.sha256, result: review.value, workflowRunId,
    });
    try { validateRiskAcceptanceSet({ acceptances: riskRecords.map(({ value }) => value), pause }); }
    catch (error) { invalid(`Phase trace risk acceptance is invalid: ${error.message}`); }
  }
  return Object.freeze({
    trace: Object.freeze({
      ...trace, review_status: reviewStatus, risk_acceptances: trace.risk_acceptances ?? [],
    }),
    traceRef: ref, traceSha256: traceRecord.sha256, phaseEvidence, scan: scanRecord,
    implementation, green, red, review, attempt, subject, acceptanceTrace,
  });
}

export function validatePhaseReviewEvidence({ phaseResult, scan, sourceRoot, phaseId } = {}) {
  if (typeof phaseId !== "string" || !/^[a-zA-Z0-9._-]+$/.test(phaseId)) invalid("phase_id is required");
  if (phaseResult?.phase_id !== phaseId) invalid("phase-result.json does not match phase_id");
  if (!scan || typeof scan !== "object" || Array.isArray(scan) || scan.schema_version !== "phase-diff-scan.v1" || scan.phase_id !== phaseId) invalid("phase diff evidence identity is invalid");
  for (const field of ["baseline_commit", "implementation_commit", "snapshot_tree"]) {
    if (typeof scan[field] !== "string" || !/^[a-f0-9]{40,64}$/.test(scan[field])) invalid(`${field} is invalid`);
  }
  git(sourceRoot, ["cat-file", "-e", `${scan.baseline_commit}^{commit}`]);
  git(sourceRoot, ["cat-file", "-e", `${scan.implementation_commit}^{commit}`]);
  if (!isAncestor(sourceRoot, scan.baseline_commit, scan.implementation_commit)) invalid("baseline_commit must be an ancestor of implementation_commit");
  const baseTree = git(sourceRoot, ["rev-parse", `${scan.baseline_commit}^{tree}`]);
  const candidateTree = git(sourceRoot, ["rev-parse", `${scan.implementation_commit}^{tree}`]);
  if (candidateTree !== scan.snapshot_tree) invalid("snapshot_tree does not match implementation_commit");
  return Object.freeze({ phaseId, baselineCommit: scan.baseline_commit, implementationCommit: scan.implementation_commit, baseTree, candidateTree });
}
