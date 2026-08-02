import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { captureWorkspaceSnapshot } from "../../core/canonical-receipt-writer.mjs";
import { assertTaskHandle, assertTaskKernel } from "../../core/task-handle.mjs";
import { assertWorkspace } from "../../core/workspace.mjs";
import { validateSchema } from "../../runtime/review/schema-validator.mjs";
import { validatePhaseAcceptanceTrace } from "../../runtime/review/phase-review-subject.mjs";
import { createPhaseDiffScan } from "./diff-scanner.mjs";
import { normalizeRuntimeOnlyPaths } from "../../runtime/evidence/canonical-utils.mjs";
import { assertAuthenticatedReviewAttempt, assertAuthenticatedReviewHead } from "../../runtime/review/review-flow-authority.mjs";
import { deriveSeriousReviewPause, validateRiskAcceptanceSet } from "../../runtime/review/stage-review-disposition.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/;
const PHASE = /^[A-Za-z0-9._-]+$/;
const REVIEW_ACTION = /^reviews\/(?:results\/[A-Za-z0-9._-]+|attempts\/[A-Za-z0-9._-]+\/attempt)\.json$/;
const RISK_ACCEPTANCE = /^evidence\/risk-acceptances\/([a-f0-9]{64})\.json$/;
const INPUT_KEYS = new Set([
  "phase_id", "implementation_receipt_ref", "green_test_receipt_ref",
  "red_evidence_ref", "allowed_files", "review_result_ref", "risk_acceptance_refs",
]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => `${JSON.stringify(value, null, 2)}\n`;

function safeRef(value, pattern, label) {
  if (typeof value !== "string" || !pattern.test(value) || value.includes("..")) throw new TypeError(`${label} is invalid`);
  return value;
}

function readJson(task, ref, label) {
  let raw;
  try { raw = task.readRecord(ref); }
  catch (error) { throw new Error(`${label} is missing: ${ref}: ${error.message}`); }
  try { return { raw, value: JSON.parse(raw), hash: sha256(raw) }; }
  catch { throw new Error(`${label} is not valid JSON: ${ref}`); }
}

function readImplementation(task, ref) {
  safeRef(ref, /^receipts\/[A-Za-z0-9._/-]+\.json$/, "implementation_receipt_ref");
  const receipt = readJson(task, ref, "implementation receipt");
  const value = receipt.value;
  if (value?.schema_version !== "workflowhub-receipt.v1" || value.task_id !== task.identity.taskId
    || value.stage !== "build-code" || value.producer?.stage !== "build-code"
    || value.producer?.component !== "implementation" || !OID.test(value.snapshot_tree ?? "")
    || !OID.test(value.snapshot_commit ?? "")) throw new Error("implementation receipt provenance is invalid");
  return { ...receipt, ref };
}

function readTestReceipt(task, ref, { green }) {
  safeRef(ref, /^receipts\/[A-Za-z0-9._/-]+\.json$/, green ? "green_test_receipt_ref" : "red_evidence_ref");
  const receipt = readJson(task, ref, green ? "GREEN test receipt" : "RED test receipt");
  const value = receipt.value;
  if (value?.schema_version !== "workflowhub-receipt.v1" || value.task_id !== task.identity.taskId
    || value.stage !== "build-code" || value.producer?.stage !== "build-code"
    || value.producer?.component !== "build-code-test-capture"
    || !OID.test(value.snapshot_tree ?? "") || !OID.test(value.snapshot_commit ?? "") || !Number.isInteger(value.exit_code)
    || (green ? value.exit_code !== 0 : value.exit_code === 0)) {
    throw new Error(`${green ? "GREEN" : "RED"} test receipt provenance is invalid`);
  }
  safeRef(value.output_ref, /^evidence\/[A-Za-z0-9._/-]+$/, "test output_ref");
  if (!HASH.test(value.output_hash ?? "") || sha256(task.readRecord(value.output_ref)) !== value.output_hash) {
    throw new Error(`${green ? "GREEN" : "RED"} test output hash mismatch`);
  }
  return { ...receipt, ref };
}

function phaseReviewSubject(phaseId) {
  return {
    stage: "build-code", review_track: null, subject_kind: "phase",
    phase_id: phaseId, review_scope: "phase",
  };
}

function expectedPhaseReviewIdentity(task, value, expected) {
  if (value.task_id !== task.identity.taskId || value.stage !== "build-code"
    || value.subject_kind !== "phase" || value.phase_id !== expected.phaseId
    || value.review_scope !== "phase" || value.base_tree !== expected.baseTree
    || value.candidate_tree !== expected.candidateTree || value.snapshot_tree !== expected.candidateTree
    || JSON.stringify(value.phase_evidence ?? null) !== JSON.stringify(expected.phaseEvidence)) {
    throw new Error("formal phase review identity does not match current Phase evidence");
  }
}

function readFormalPhaseReview(task, kernel, ref, expected) {
  safeRef(ref, REVIEW_ACTION, "review action ref");
  const review = readJson(task, ref, "formal phase review action");
  const subject = phaseReviewSubject(expected.phaseId);
  if (ref.startsWith("reviews/attempts/")) {
    validateSchema("attempt", review.value);
    expectedPhaseReviewIdentity(task, review.value, expected);
    if (review.value.terminal_status !== "unavailable" || !review.value.error
      || !Array.isArray(review.value.provider_attempts) || review.value.provider_attempts.length === 0) {
      throw new Error("formal phase review attempt is not an unavailable provider attempt");
    }
    const authenticated = assertAuthenticatedReviewAttempt({
      readFlow: (requested) => kernel.readReviewFlow(kernel.deriveReviewFlowIdentity(requested)),
      attemptRef: ref, attemptHash: review.hash, attempt: review.value, expected: subject,
    });
    return { ...review, ref, status: "unavailable", verdict: null, attempt_ref: ref, attempt: review, authenticated };
  }
  validateSchema("result", review.value);
  expectedPhaseReviewIdentity(task, review.value, expected);
  if (!new Set(["pass", "revise_required"]).has(review.value.verdict)) {
    throw new Error("formal phase review semantic verdict is invalid");
  }
  const authenticated = assertAuthenticatedReviewHead({
    readFlow: (requested) => kernel.readReviewFlow(kernel.deriveReviewFlowIdentity(requested)),
    reviewRef: ref, reviewHash: review.hash, result: review.value, expected: subject,
  });
  const attempt = readJson(task, review.value.attempt_ref, "formal phase review attempt");
  validateSchema("attempt", attempt.value);
  for (const key of ["task_id", "stage", "subject_kind", "phase_id", "review_scope", "base_tree", "candidate_tree", "snapshot_tree", "material_id"]) {
    if (attempt.value[key] !== review.value[key]) throw new Error(`formal phase review attempt/result ${key} mismatch`);
  }
  if (JSON.stringify(attempt.value.phase_evidence ?? null) !== JSON.stringify(review.value.phase_evidence ?? null)) {
    throw new Error("formal phase review attempt/result phase_evidence mismatch");
  }
  return { ...review, ref, status: "semantic", verdict: review.value.verdict, attempt_ref: review.value.attempt_ref, attempt, authenticated };
}

function bindPhaseReviewRisks(task, review, refs) {
  const supplied = refs ?? [];
  if (!Array.isArray(supplied) || supplied.some((ref) => typeof ref !== "string")) {
    throw new TypeError("risk_acceptance_refs must be an array of canonical refs");
  }
  if (review.status === "unavailable") {
    if (supplied.length) throw new Error("unavailable Phase review cannot use a risk acceptance");
    return [];
  }
  const pause = deriveSeriousReviewPause({
    taskId: task.identity.taskId, stage: "build-code", reviewRef: review.ref,
    reviewHash: review.hash, result: review.value,
    workflowRunId: review.authenticated.flow.identity.workflow_run_id,
  });
  if (pause.status !== "paused") {
    if (supplied.length) throw new Error("risk acceptance cannot override a Phase review without actionable serious findings");
    return [];
  }
  if (!supplied.length) throw new Error("SERIOUS_REVIEW_PAUSE: actionable serious Phase findings require repair or exact risk acceptance");
  const records = supplied.map((ref) => {
    const match = RISK_ACCEPTANCE.exec(ref);
    if (!match) throw new Error("Phase risk acceptance ref is outside the canonical namespace");
    const record = readJson(task, ref, "Phase risk acceptance");
    if (record.hash !== match[1]) throw new Error("Phase risk acceptance is not content-addressed");
    return record;
  });
  validateRiskAcceptanceSet({ acceptances: records.map(({ value }) => value), pause });
  return records.map((record, index) => ({ ref: supplied[index], sha256: record.hash }));
}

function currentMaterialsBaseline(task, workspace) {
  const root = workspace.worktreeRoot;
  const head = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  const index = resolve(tmpdir(), `workflowhub-current-materials-${randomUUID()}.index`);
  const env = { ...process.env, GIT_INDEX_FILE: index };
  const taskRoot = `specs/${task.identity.taskId}`;
  const paths = ["decision-log.md", "spec.md", "plan.md", "tasks.md"].map((name) => `${taskRoot}/${name}`);
  try {
    execFileSync("git", ["read-tree", `${head}^{tree}`], { cwd: root, env, stdio: "ignore" });
    execFileSync("git", ["add", "--", ...paths], { cwd: root, env, stdio: "ignore" });
    const tree = execFileSync("git", ["write-tree"], { cwd: root, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    return execFileSync("git", ["commit-tree", tree, "-p", head, "-m", "workflowhub current task materials baseline"], {
      cwd: root,
      env: {
        ...env,
        GIT_AUTHOR_NAME: "WorkflowHub", GIT_AUTHOR_EMAIL: "workflowhub@local",
        GIT_COMMITTER_NAME: "WorkflowHub", GIT_COMMITTER_EMAIL: "workflowhub@local",
        GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z", GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z",
      }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } finally {
    rmSync(index, { force: true });
  }
}

function phaseCommit(workspace, tree, baseline, phaseId) {
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "WorkflowHub", GIT_AUTHOR_EMAIL: "workflowhub@local",
    GIT_COMMITTER_NAME: "WorkflowHub", GIT_COMMITTER_EMAIL: "workflowhub@local",
    GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z", GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z",
  };
  return execFileSync("git", ["commit-tree", tree, "-p", baseline, "-m", `workflowhub phase ${phaseId} snapshot`], {
    cwd: workspace.worktreeRoot, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export function assertLiveWorkspaceMatchesImplementation(workspace, implementation, snapshot) {
  if (snapshot.tree !== implementation.value.snapshot_tree) {
    throw new Error("live Workspace snapshot drifted from the implementation receipt; collect fresh current evidence");
  }
}

function phaseCommitRef(task, phaseId, snapshotTree) {
  return `refs/workflowhub/phases/${task.identity.projectName}/${task.identity.taskId}/build-code/${phaseId}/snapshot-${snapshotTree}`;
}

function pinPhaseCommit(workspace, task, phaseId, snapshotTree, implementationCommit) {
  const ref = phaseCommitRef(task, phaseId, snapshotTree);
  const resolveRef = () => {
    try { return execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], { cwd: workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
    catch (error) { if (error.status === 128) return null; throw error; }
  };
  const current = resolveRef();
  if (current !== null && current !== implementationCommit) throw new Error("Phase snapshot ref already points to a different commit");
  if (current === null) {
    try { execFileSync("git", ["update-ref", ref, implementationCommit, "0".repeat(40)], { cwd: workspace.worktreeRoot, stdio: ["ignore", "pipe", "pipe"] }); }
    catch { if (resolveRef() !== implementationCommit) throw new Error("Phase snapshot ref could not be created immutably"); }
  }
  return ref;
}

function publishIdempotently(task, kernel, ref, raw, label) {
  try {
    if (task.readRecord(ref) !== raw) throw new Error(`${label} already exists with different content`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    kernel.publishCanonicalRecord(ref, raw);
  }
}

function phaseMapTrace({ scan, scanRef, scanHash, canonicalEvidenceRef, canonicalEvidenceHash, implementation, green, red, review, implementationCommitRef, riskAcceptances }) {
  const acceptanceTrace = validatePhaseAcceptanceTrace({
    trace: review.attempt.value.phase_ac_trace,
    phaseId: scan.phase_id, baseTree: review.value.base_tree, snapshotTree: scan.snapshot_tree,
    changedFiles: scan.changed_files, greenTestReceipt: { ref: green.ref, sha256: green.hash }, required: false,
  });
  return {
    schema_version: "phase-map-trace.v1", phase_id: scan.phase_id,
    baseline_commit: scan.baseline_commit, implementation_commit: scan.implementation_commit,
    implementation_commit_ref: implementationCommitRef, base_tree: review.value.base_tree,
    snapshot_tree: scan.snapshot_tree, allowed_files: [...scan.allowed_files], changed_files: [...scan.changed_files],
    canonical_phase_evidence: { ref: canonicalEvidenceRef, sha256: canonicalEvidenceHash },
    diff_scan: { ref: scanRef, sha256: scanHash },
    implementation_receipt: { ref: implementation.ref, sha256: implementation.hash },
    green_test_receipt: { ref: green.ref, sha256: green.hash },
    red_test_receipt: red === null ? null : { ref: red.ref, sha256: red.hash },
    review_status: review.status, review_result: review.status === "semantic" ? { ref: review.ref, sha256: review.hash } : null,
    review_attempt: { ref: review.attempt_ref, sha256: review.attempt.hash }, material_id: review.value.material_id,
    review_scope: "phase", verdict: review.verdict, risk_acceptances: riskAcceptances,
    ...(acceptanceTrace === null ? {} : { acceptance_trace: acceptanceTrace }),
  };
}

export function validatePhaseEvidenceInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)
    || Object.keys(input).some((key) => !INPUT_KEYS.has(key))) throw new TypeError("phase evidence input contains unknown fields");
  if (!PHASE.test(input.phase_id ?? "")) throw new TypeError("phase_id is invalid");
  if (input.risk_acceptance_refs !== undefined
    && (!Array.isArray(input.risk_acceptance_refs)
      || input.risk_acceptance_refs.some((ref) => typeof ref !== "string" || !RISK_ACCEPTANCE.test(ref))
      || new Set(input.risk_acceptance_refs).size !== input.risk_acceptance_refs.length)) {
    throw new TypeError("risk_acceptance_refs must contain unique canonical risk acceptance refs");
  }
  if (!Array.isArray(input.allowed_files) || !input.allowed_files.every((file) => typeof file === "string" && file.length > 0
    && !file.startsWith("/") && !file.includes("\\") && file.split("/").every((part) => part && part !== "." && part !== ".."))
    || new Set(input.allowed_files).size !== input.allowed_files.length) {
    throw new TypeError("allowed_files must be an array of repository-relative paths");
  }
  return input;
}

export function publishBuildCodePhaseEvidence(context, rawInput) {
  const task = assertTaskHandle(context?.task);
  const kernel = assertTaskKernel(context?.kernel);
  const workspace = assertWorkspace(context?.workspace);
  const input = validatePhaseEvidenceInput(rawInput);
  const allowedFiles = normalizeRuntimeOnlyPaths(input.allowed_files);
  const implementation = readImplementation(task, input.implementation_receipt_ref);
  const green = readTestReceipt(task, input.green_test_receipt_ref, { green: true });
  const red = input.red_evidence_ref === undefined ? null : readTestReceipt(task, input.red_evidence_ref, { green: false });
  if (green.value.snapshot_tree !== implementation.value.snapshot_tree) throw new Error("GREEN and implementation snapshot trees do not match");
  const implementationTree = execFileSync("git", ["rev-parse", `${implementation.value.snapshot_commit}^{tree}`], { cwd: workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  if (implementationTree !== implementation.value.snapshot_tree) throw new Error("implementation snapshot_commit tree mismatch");
  const receiptTree = execFileSync("git", ["rev-parse", `${green.value.snapshot_commit}^{tree}`], { cwd: workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  if (receiptTree !== green.value.snapshot_tree) throw new Error("GREEN test receipt snapshot_commit tree mismatch");

  return task.withRecordLock("locks/build-code-phase-evidence.lock", () => {
    const before = captureWorkspaceSnapshot(workspace);
    assertLiveWorkspaceMatchesImplementation(workspace, implementation, before);
    const baseline = red === null ? currentMaterialsBaseline(task, workspace) : red.value.snapshot_commit;
    const baselineTree = execFileSync("git", ["rev-parse", `${baseline}^{tree}`], { cwd: workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    if (red !== null && red.value.snapshot_tree !== baselineTree) throw new Error("RED test receipt must bind the current Phase baseline tree");
    const implementationCommit = phaseCommit(workspace, implementation.value.snapshot_tree, baseline, input.phase_id);
    const implementationCommitRef = pinPhaseCommit(workspace, task, input.phase_id, implementation.value.snapshot_tree, implementationCommit);
    const scan = createPhaseDiffScan({ sourceRoot: workspace.worktreeRoot, phaseId: input.phase_id, baselineCommit: baseline, implementationCommit, allowedFiles });
    if (!scan.safe) throw new Error(`Phase diff is outside the allowed scope: ${JSON.stringify(scan.allowlist_violations)}`);
    if (captureWorkspaceSnapshot(workspace).tree !== before.tree) throw new Error("live Workspace changed while Phase evidence was being published");
    const namespace = `evidence/phases/${input.phase_id}/${scan.snapshot_tree}`;
    const scanRaw = canonical(scan);
    const scanRef = `${namespace}/diff-scan-${sha256(scanRaw)}.json`;
    publishIdempotently(task, kernel, scanRef, scanRaw, "Phase diff scan");
    const evidence = {
      phase_id: input.phase_id, status: input.review_result_ref === undefined ? "awaiting_review" : "done", needs_human: false,
      tests: { ...(red === null ? {} : { red: { path: input.red_evidence_ref } }), green: { path: input.green_test_receipt_ref } },
      diff_scan: { path: scanRef }, declared_allowed_files: allowedFiles,
      evidence: { diff: scanRef, implementation_receipt_ref: input.implementation_receipt_ref, green_test_receipt_ref: input.green_test_receipt_ref, ...(red === null ? {} : { red_evidence_ref: input.red_evidence_ref }) },
    };
    const evidenceRaw = canonical(evidence);
    const canonicalEvidenceHash = sha256(evidenceRaw);
    const canonicalEvidenceRef = `${namespace}/phase-evidence-${canonicalEvidenceHash}.json`;
    publishIdempotently(task, kernel, canonicalEvidenceRef, evidenceRaw, "canonical Phase evidence");
    evidence.evidence.canonical_phase_evidence_ref = canonicalEvidenceRef;
    let review;
    if (input.review_result_ref !== undefined) {
      review = readFormalPhaseReview(task, kernel, input.review_result_ref, {
        phaseId: input.phase_id, baseTree: baselineTree, candidateTree: scan.snapshot_tree,
        phaseEvidence: { ref: canonicalEvidenceRef, sha256: canonicalEvidenceHash },
      });
      const riskAcceptances = bindPhaseReviewRisks(task, review, input.risk_acceptance_refs);
      const trace = phaseMapTrace({ scan, scanRef, scanHash: sha256(scanRaw), canonicalEvidenceRef, canonicalEvidenceHash, implementation, green, red, review, implementationCommitRef, riskAcceptances });
      const traceRaw = canonical(trace);
      const traceRef = `${namespace}/phase-map-trace-${sha256(traceRaw)}.json`;
      publishIdempotently(task, kernel, traceRef, traceRaw, "Phase map trace");
      evidence.evidence.phase_map_trace_ref = traceRef;
      evidence.review = { action_ref: input.review_result_ref, ...(review.status === "semantic" ? { result_ref: input.review_result_ref } : {}), snapshot_tree: scan.snapshot_tree, status: review.status, verdict: review.verdict, risk_acceptances: riskAcceptances };
    }
    task.writeRecordAtomic("phase-result.json", canonical(evidence));
    return Object.freeze({ phase_id: input.phase_id, baseline_commit: baseline, implementation_commit: implementationCommit, base_tree: baselineTree, snapshot_tree: scan.snapshot_tree, diff_scan_ref: scanRef, canonical_phase_evidence_ref: canonicalEvidenceRef, ...(review ? { review_result_ref: input.review_result_ref, review_status: review.status, review_verdict: review.verdict, phase_map_trace_ref: evidence.evidence.phase_map_trace_ref } : {}) });
  });
}
